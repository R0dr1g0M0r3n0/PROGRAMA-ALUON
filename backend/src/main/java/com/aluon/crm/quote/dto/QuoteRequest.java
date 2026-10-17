package com.aluon.crm.quote.dto;

import com.aluon.crm.customer.model.Customer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.aluon.crm.quote.model.QuoteChannel;
import com.aluon.crm.quote.model.QuoteItem;
import com.aluon.crm.quote.model.QuoteStatus;
import com.aluon.crm.quote.model.QuoteValidationMode;


@Entity
@Table(name = "quote_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "quote_number", nullable = false, unique = true)
    private String quoteNumber;

    @Column(name = "series_date")
    private LocalDate seriesDate;

    @Column(name = "series_sequence")
    private Integer seriesSequence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "tariff_code")
    private String tariffCode;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_whatsapp")
    private String contactWhatsapp;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private QuoteStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "validation_mode", nullable = false)
    private QuoteValidationMode validationMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    private QuoteChannel channel;

    @Column(name = "total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "converted_order_id")
    private UUID convertedOrderId;

    @Column(name = "parent_quote_id")
    private UUID parentQuoteId;

    @Column(name = "revision", nullable = false)
    @Builder.Default
    private Integer revision = 1;

    @OneToMany(mappedBy = "quoteRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuoteItem> items = new ArrayList<>();
}
