package com.aluon.erp.customer.service;

import com.aluon.crm.customer.model.Customer;
import com.aluon.crm.customer.model.PaymentMethod;
import com.aluon.crm.customer.service.CustomerService;
import com.aluon.crm.customer.model.DeliveryAddress;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.aluon.erp.customer.dto.ErpCustomerCreateRequest;
import com.aluon.erp.customer.dto.ErpCustomerResponse;
import com.aluon.erp.customer.dto.ErpDeliveryAddressRequest;
import com.aluon.erp.customer.dto.ErpDeliveryAddressResponse;


@Service
@RequiredArgsConstructor
@Transactional
public class ErpCustomerService {

    private final CustomerService customerService;

    @Transactional(readOnly = true)
    public List<ErpCustomerResponse> listAll() {
        return customerService.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ErpCustomerResponse getById(UUID id) {
        return toResponse(customerService.findById(id));
    }

    @Transactional(readOnly = true)
    public boolean documentExists(String numeroDocumento, UUID excludeId) {
        return customerService.documentExists(numeroDocumento, excludeId);
    }

    public ErpCustomerResponse create(ErpCustomerCreateRequest request) {
        validate(request);
        Customer customer = toEntity(request);
        Customer saved = customerService.save(customer);
        return toResponse(saved);
    }

    public ErpCustomerResponse update(UUID id, ErpCustomerCreateRequest request) {
        validate(request);
        Customer existing = customerService.findById(id);
        apply(existing, request);
        Customer saved = customerService.save(existing);
        return toResponse(saved);
    }

    public void delete(UUID id) {
        customerService.deleteById(id);
    }

    private Customer toEntity(ErpCustomerCreateRequest request) {
        Customer customer = Customer.builder()
                .nombreComercial(trim(request.getNombreComercial()))
                .razonSocial(trimToNull(request.getRazonSocial()))
                .personaContacto(trimToNull(request.getPersonaContacto()))
                .tarifa(trimToNull(request.getTarifa()))
                .tipoDocumento(request.getTipoDocumento())
                .numeroDocumento(trimToNull(request.getNumeroDocumento()))
                .telefono(trimToNull(request.getTelefono()))
                .email(trimToNull(request.getEmail()))
                .direccion(trimToNull(request.getDireccion()))
                .cp(trimToNull(request.getCp()))
                .poblacion(trimToNull(request.getPoblacion()))
                .provincia(trimToNull(request.getProvincia()))
                .pais(trimToNull(request.getPais()))
                .iban(trimToNull(request.getIban()))
                .formaPago(normalizePaymentMethod(request.getFormaPago()))
                .diasVencimiento(request.getDiasVencimiento())
                .autoApproveQuotes(Boolean.TRUE.equals(request.getAutoApproveQuotes()))
                .remanente(request.getRemanente())
                .direccionesEntrega(new ArrayList<>())
                .build();

        applyAddresses(customer, request);
        return customer;
    }

    private void apply(Customer customer, ErpCustomerCreateRequest request) {
        customer.setNombreComercial(trim(request.getNombreComercial()));
        customer.setRazonSocial(trimToNull(request.getRazonSocial()));
        customer.setPersonaContacto(trimToNull(request.getPersonaContacto()));
        customer.setTarifa(trimToNull(request.getTarifa()));
        customer.setTipoDocumento(request.getTipoDocumento());
        customer.setNumeroDocumento(trimToNull(request.getNumeroDocumento()));
        customer.setTelefono(trimToNull(request.getTelefono()));
        customer.setEmail(trimToNull(request.getEmail()));
        customer.setDireccion(trimToNull(request.getDireccion()));
        customer.setCp(trimToNull(request.getCp()));
        customer.setPoblacion(trimToNull(request.getPoblacion()));
        customer.setProvincia(trimToNull(request.getProvincia()));
        customer.setPais(trimToNull(request.getPais()));
        customer.setIban(trimToNull(request.getIban()));
        customer.setFormaPago(normalizePaymentMethod(request.getFormaPago()));
        customer.setDiasVencimiento(request.getDiasVencimiento());
        customer.setAutoApproveQuotes(Boolean.TRUE.equals(request.getAutoApproveQuotes()));
        customer.setRemanente(request.getRemanente());
        applyAddresses(customer, request);
    }

    private void applyAddresses(Customer customer, ErpCustomerCreateRequest request) {
        if (customer.getDireccionesEntrega() != null) {
            customer.getDireccionesEntrega().clear();
        } else {
            customer.setDireccionesEntrega(new ArrayList<>());
        }
        if (request.getDireccionesEntrega() != null) {
            request.getDireccionesEntrega().forEach(address -> {
                DeliveryAddress deliveryAddress = DeliveryAddress.builder()
                        .nombreAlias(trim(address.getNombreAlias()))
                        .direccion(trimToNull(address.getDireccion()))
                        .cp(trimToNull(address.getCp()))
                        .poblacion(trimToNull(address.getPoblacion()))
                        .provincia(trimToNull(address.getProvincia()))
                        .telefono(trimToNull(address.getTelefono()))
                        .contacto(trimToNull(address.getContacto()))
                        .build();
                customer.addDireccion(deliveryAddress);
            });
        }
    }

    private ErpCustomerResponse toResponse(Customer customer) {
        List<ErpDeliveryAddressResponse> addresses = customer.getDireccionesEntrega() == null
                ? List.of()
                : customer.getDireccionesEntrega().stream()
                .map(address -> ErpDeliveryAddressResponse.builder()
                        .id(address.getId() != null ? address.getId().toString() : null)
                        .nombreAlias(address.getNombreAlias())
                        .direccion(address.getDireccion())
                        .cp(address.getCp())
                        .poblacion(address.getPoblacion())
                        .provincia(address.getProvincia())
                        .telefono(address.getTelefono())
                        .contacto(address.getContacto())
                        .build())
                .toList();

        return ErpCustomerResponse.builder()
                .id(customer.getId() != null ? customer.getId().toString() : null)
                .nombreComercial(customer.getNombreComercial())
                .razonSocial(customer.getRazonSocial())
                .personaContacto(customer.getPersonaContacto())
                .tarifa(customer.getTarifa())
                .tipoDocumento(customer.getTipoDocumento())
                .numeroDocumento(customer.getNumeroDocumento())
                .telefono(customer.getTelefono())
                .email(customer.getEmail())
                .direccion(customer.getDireccion())
                .cp(customer.getCp())
                .poblacion(customer.getPoblacion())
                .provincia(customer.getProvincia())
                .pais(customer.getPais())
                .iban(customer.getIban())
                .formaPago(customer.getFormaPago())
                .diasVencimiento(customer.getDiasVencimiento())
                .autoApproveQuotes(customer.isAutoApproveQuotes())
                .remanente(customer.getRemanente())
                .direccionesEntrega(addresses)
                .build();
    }

    private void validate(ErpCustomerCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud es obligatoria");
        }
        if (isBlank(request.getNombreComercial())) {
            throw new IllegalArgumentException("El nombre comercial es obligatorio");
        }
        validatePaymentMethod(request.getFormaPago());
        if (request.getDireccionesEntrega() != null) {
            for (ErpDeliveryAddressRequest address : request.getDireccionesEntrega()) {
                if (address == null) {
                    throw new IllegalArgumentException("La dirección de entrega es obligatoria");
                }
                if (isBlank(address.getNombreAlias())) {
                    throw new IllegalArgumentException("El alias de la dirección es obligatorio");
                }
            }
        }
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String trimToNull(String value) {
        String trimmed = trim(value);
        return trimmed == null || trimmed.isBlank() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void validatePaymentMethod(String value) {
        if (isBlank(value)) {
            throw new IllegalArgumentException("La forma de pago es obligatoria");
        }
        if (!PaymentMethod.isValid(value)) {
            throw new IllegalArgumentException("La forma de pago debe ser TRANSFERENCIA, GIRO, TARJETA o CONTADO");
        }
    }

    private String normalizePaymentMethod(String value) {
        validatePaymentMethod(value);
        return PaymentMethod.normalize(value);
    }
}
