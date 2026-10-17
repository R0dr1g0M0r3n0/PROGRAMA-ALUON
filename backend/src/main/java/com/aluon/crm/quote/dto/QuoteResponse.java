package com.aluon.crm.quote.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.aluon.crm.quote.model.QuoteChannel;
import com.aluon.crm.quote.model.QuoteStatus;
import com.aluon.crm.quote.model.QuoteValidationMode;


@Getter
@Builder
public class QuoteResponse {
    private UUID id;
    private String quoteNumber;
    private UUID customerId;
    private String customerName;
    private String customerNombreComercial;
    private String customerTipoDocumento;
    private String customerNumeroDocumento;
    private String customerTelefono;
    private String customerDireccion;
    private String customerCp;
    private String customerPoblacion;
    private String customerProvincia;
    private String deliveryDireccionEntrega;
    private String deliveryCp;
    private String deliveryPoblacion;
    private String deliveryProvincia;
    private String contactEmail;
    private String contactWhatsapp;
    private String tariffCode;
    private QuoteStatus status;
    private QuoteValidationMode validationMode;
    private QuoteChannel channel;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private LocalDateTime validatedAt;
    private LocalDateTime sentAt;
    private UUID convertedOrderId;
    private UUID parentQuoteId;
    private Integer revision;
    private List<QuoteItemResponse> items;
}
