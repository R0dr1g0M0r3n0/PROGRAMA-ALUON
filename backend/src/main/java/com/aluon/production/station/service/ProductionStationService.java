package com.aluon.production.station.service;

import com.aluon.core.user.model.User;
import com.aluon.core.user.repository.UserRepository;
import com.aluon.production.order.model.Order;
import com.aluon.production.order.model.OrderStatus;
import com.aluon.production.order.repository.OrderRepository;
import com.aluon.production.station.dto.ProductionStationDto;
import com.aluon.production.station.model.ProductionStation;
import com.aluon.production.station.model.ProductionStationCode;
import com.aluon.production.station.model.ProductionStationStatus;
import com.aluon.production.station.repository.ProductionStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionStationService {

    private final ProductionStationRepository stationRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Inicializa las 7 estaciones de la cadena de montaje para una orden.
     * Idempotente: si ya existen, no las duplica.
     */
    @Transactional
    public List<ProductionStationDto> initializeStations(UUID orderId) {
        if (stationRepository.existsByOrderId(orderId)) {
            log.info("Stations already initialized for order {}", orderId);
            return getStations(orderId);
        }

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada: " + orderId));

        List<ProductionStation> stations = Arrays.stream(ProductionStationCode.values())
            .map(code -> ProductionStation.builder()
                .order(order)
                .stationCode(code)
                .sequenceOrder(code.getSequenceOrder())
                .status(ProductionStationStatus.PENDING)
                .build())
            .toList();

        stationRepository.saveAll(stations);
        log.info("Initialized {} stations for order {}", stations.size(), orderId);
        return getStations(orderId);
    }

    /** Lista las estaciones de una orden, ordenadas por secuencia. */
    @Transactional(readOnly = true)
    public List<ProductionStationDto> getStations(UUID orderId) {
        return stationRepository.findByOrderIdOrderBySequenceOrder(orderId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    /**
     * Avanza una estación (PENDING → IN_PROGRESS o IN_PROGRESS → COMPLETED).
     * Valida que la estación anterior esté COMPLETED antes de iniciar.
     */
    @Transactional
    public ProductionStationDto advanceStation(
        UUID orderId,
        ProductionStationCode stationCode,
        ProductionStationStatus targetStatus,
        Long operatorUserId,
        String operatorName,
        String notes
    ) {
        ProductionStation station = findStation(orderId, stationCode);
        validateAdvanceTransition(station, targetStatus);
        validatePreviousStationCompleted(orderId, stationCode);

        User operator = resolveOperator(operatorUserId);

        station.setStatus(targetStatus);
        if (targetStatus == ProductionStationStatus.IN_PROGRESS) {
            station.setStartedAt(LocalDateTime.now());
            assignOperator(station, operator, operatorName);
        } else if (targetStatus == ProductionStationStatus.COMPLETED) {
            station.setCompletedAt(LocalDateTime.now());
            if (station.getOperatorUser() == null) {
                assignOperator(station, operator, operatorName);
            }
        }
        if (notes != null && !notes.isBlank()) {
            station.setNotes(notes);
        }
        stationRepository.save(station);
        syncOrderOperationalStatus(orderId, targetStatus);
        log.info("Station {} advanced to {} for order {}", stationCode, targetStatus, orderId);
        return toDto(station);
    }

    /** Bloquea una estación con un motivo. */
    @Transactional
    public ProductionStationDto blockStation(UUID orderId, ProductionStationCode stationCode, String reason) {
        ProductionStation station = findStation(orderId, stationCode);
        if (station.getStatus() != ProductionStationStatus.IN_PROGRESS) {
            throw new IllegalStateException("Solo se puede bloquear una estación EN PROGRESO.");
        }
        station.setStatus(ProductionStationStatus.BLOCKED);
        station.setBlockReason(reason);
        station.setBlockedAt(LocalDateTime.now());
        stationRepository.save(station);
        log.info("Station {} blocked for order {}: {}", stationCode, orderId, reason);
        return toDto(station);
    }

    /** Desbloquea una estación, volviéndola a IN_PROGRESS. */
    @Transactional
    public ProductionStationDto unblockStation(UUID orderId, ProductionStationCode stationCode) {
        ProductionStation station = findStation(orderId, stationCode);
        if (station.getStatus() != ProductionStationStatus.BLOCKED) {
            throw new IllegalStateException("Solo se puede desbloquear una estación BLOQUEADA.");
        }
        station.setStatus(ProductionStationStatus.IN_PROGRESS);
        station.setUnblockedAt(LocalDateTime.now());
        stationRepository.save(station);
        log.info("Station {} unblocked for order {}", stationCode, orderId);
        return toDto(station);
    }

    // ─── Private helpers ─────────────────────────────────────────

    private ProductionStation findStation(UUID orderId, ProductionStationCode stationCode) {
        return stationRepository.findByOrderIdAndStationCode(orderId, stationCode)
            .orElseThrow(() -> new IllegalArgumentException(
                "Estación %s no encontrada para orden %s".formatted(stationCode, orderId)
            ));
    }

    private void validateAdvanceTransition(ProductionStation station, ProductionStationStatus target) {
        ProductionStationStatus current = station.getStatus();
        boolean valid = (current == ProductionStationStatus.PENDING && target == ProductionStationStatus.IN_PROGRESS)
            || (current == ProductionStationStatus.IN_PROGRESS && target == ProductionStationStatus.COMPLETED);
        if (!valid) {
            throw new IllegalStateException(
                "Transición inválida: %s → %s".formatted(current, target)
            );
        }
    }

    private void validatePreviousStationCompleted(UUID orderId, ProductionStationCode current) {
        int currentSeq = current.getSequenceOrder();
        if (currentSeq <= 1) return; // First station has no predecessor

        List<ProductionStation> stations = stationRepository.findByOrderIdOrderBySequenceOrder(orderId);
        stations.stream()
            .filter(s -> s.getSequenceOrder() == currentSeq - 1)
            .findFirst()
            .ifPresent(prev -> {
                ProductionStationStatus prevStatus = prev.getStatus();
                boolean allowed = prevStatus == ProductionStationStatus.COMPLETED
                    || prevStatus == ProductionStationStatus.SKIPPED;
                if (!allowed) {
                    throw new IllegalStateException(
                        "La estación anterior (%s) debe estar completada. Estado actual: %s"
                            .formatted(prev.getStationCode(), prevStatus)
                    );
                }
            });
    }

    private User resolveOperator(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    private void assignOperator(ProductionStation station, User operator, String operatorName) {
        if (operator != null) {
            station.setOperatorUser(operator);
            station.setOperatorName(operator.getNombre());
        } else if (operatorName != null && !operatorName.isBlank()) {
            station.setOperatorName(operatorName);
        }
    }

    private void syncOrderOperationalStatus(UUID orderId, ProductionStationStatus targetStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada: " + orderId));

        if (targetStatus == ProductionStationStatus.IN_PROGRESS) {
            if (order.getEstado() != OrderStatus.LISTO_MONTAJE
                && order.getEstado() != OrderStatus.INSTALADA
                && order.getEstado() != OrderStatus.FACTURADA) {
                order.setEstado(OrderStatus.EN_PRODUCCION);
                orderRepository.save(order);
            }
            return;
        }

        boolean allCompleted = stationRepository.findByOrderIdOrderBySequenceOrder(orderId).stream()
            .allMatch(station -> station.getStatus() == ProductionStationStatus.COMPLETED
                || station.getStatus() == ProductionStationStatus.SKIPPED);
        if (allCompleted && order.getEstado() != OrderStatus.INSTALADA && order.getEstado() != OrderStatus.FACTURADA) {
            order.setEstado(OrderStatus.LISTO_MONTAJE);
            orderRepository.save(order);
        }
    }

    private ProductionStationDto toDto(ProductionStation entity) {
        return new ProductionStationDto(
            entity.getId(),
            entity.getStationCode(),
            entity.getStationCode().getLabel(),
            entity.getSequenceOrder(),
            entity.getStatus(),
            entity.getOperatorUser() != null ? entity.getOperatorUser().getId() : null,
            entity.getOperatorName(),
            entity.getStartedAt(),
            entity.getCompletedAt(),
            entity.getBlockReason(),
            entity.getBlockedAt(),
            entity.getUnblockedAt(),
            entity.getNotes()
        );
    }
}
