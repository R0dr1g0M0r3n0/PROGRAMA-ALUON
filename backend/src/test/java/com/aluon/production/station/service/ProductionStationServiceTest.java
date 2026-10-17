package com.aluon.production.station.service;

import com.aluon.production.order.model.Order;
import com.aluon.production.order.model.OrderStatus;
import com.aluon.production.station.model.ProductionStation;
import com.aluon.production.station.model.ProductionStationCode;
import com.aluon.production.station.model.ProductionStationStatus;
import com.aluon.production.station.repository.ProductionStationRepository;
import com.aluon.production.order.repository.OrderRepository;
import com.aluon.core.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionStationServiceTest {

    @Mock
    private ProductionStationRepository stationRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProductionStationService service;

    @Test
    void startingFirstStationMarksOrderAsInProduction() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).estado(OrderStatus.PENDIENTE_MATERIAL).build();
        ProductionStation station = station(order, ProductionStationStatus.PENDING);

        when(stationRepository.findByOrderIdAndStationCode(orderId, ProductionStationCode.CORTE))
            .thenReturn(Optional.of(station));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        service.advanceStation(orderId, ProductionStationCode.CORTE, ProductionStationStatus.IN_PROGRESS,
            null, "Operario de prueba", null);

        assertEquals(OrderStatus.EN_PRODUCCION, order.getEstado());
        verify(orderRepository).save(order);
    }

    @Test
    void completingLastStationMarksOrderReadyForAssembly() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).estado(OrderStatus.EN_PRODUCCION).build();
        ProductionStation station = station(order, ProductionStationStatus.IN_PROGRESS);

        when(stationRepository.findByOrderIdAndStationCode(orderId, ProductionStationCode.CORTE))
            .thenReturn(Optional.of(station));
        when(stationRepository.findByOrderIdOrderBySequenceOrder(orderId))
            .thenReturn(List.of(station));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        service.advanceStation(orderId, ProductionStationCode.CORTE, ProductionStationStatus.COMPLETED,
            null, "Operario de prueba", null);

        assertEquals(OrderStatus.LISTO_MONTAJE, order.getEstado());
        verify(orderRepository).save(order);
    }

    private ProductionStation station(Order order, ProductionStationStatus status) {
        return ProductionStation.builder()
            .id(UUID.randomUUID())
            .order(order)
            .stationCode(ProductionStationCode.CORTE)
            .sequenceOrder(1)
            .status(status)
            .build();
    }
}
