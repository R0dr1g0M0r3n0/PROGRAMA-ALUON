package com.aluon.crm.infra;

import com.aluon.core.tenant.service.CurrentTenantIdentifierResolverImpl;
import com.aluon.crm.customer.model.Customer;
import com.aluon.crm.customer.service.CustomerService;
import com.aluon.crm.quote.dto.QuoteRequest;
import com.aluon.crm.quote.model.QuoteChannel;
import com.aluon.crm.quote.model.QuoteDocument;
import com.aluon.crm.quote.model.QuoteItem;
import com.aluon.crm.quote.model.QuoteStatus;
import com.aluon.crm.quote.model.QuoteValidationMode;
import com.aluon.crm.quote.repository.QuoteDocumentRepository;
import com.aluon.crm.quote.repository.QuoteItemRepository;
import com.aluon.crm.quote.repository.QuoteRequestRepository;
import com.aluon.crm.quote.service.QuotePdfService;
import com.aluon.production.cutlist.model.DoorModel;
import com.aluon.production.cutlist.model.DoorType;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Component
@Profile("local")
@Order(2)
@RequiredArgsConstructor
public class LocalYearBillingSeeder implements ApplicationRunner {

    private static final UUID DEMO_TENANT_ID = new UUID(0L, 0L);
    private static final String DOC_TIPO_FACTURA = "FACTURA";
    private static final int TARGET_INVOICES_MIN_YTD = 60;
    private static final String RUNTIME_TENANT_ID_PROP = "APP_TENANT_RUNTIME_ID";

    private final CustomerService customerService;
    private final QuoteRequestRepository quoteRequestRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final QuoteDocumentRepository quoteDocumentRepository;
    private final QuotePdfService quotePdfService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        CurrentTenantIdentifierResolverImpl.setTenantId(DEMO_TENANT_ID);
        System.setProperty(RUNTIME_TENANT_ID_PROP, DEMO_TENANT_ID.toString());
        try {
            seedBillingJanToNow2026();
        } finally {
            System.clearProperty(RUNTIME_TENANT_ID_PROP);
            CurrentTenantIdentifierResolverImpl.clear();
        }
    }

    private void seedBillingJanToNow2026() {
        LocalDate today = LocalDate.now();
        if (today.getYear() < 2026) {
            return;
        }

        LocalDateTime startOfYear = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime endExclusive = LocalDateTime.of(today.getYear(), today.getMonth(), today.getDayOfMonth(), 0, 0)
                .plusDays(1);

        long currentInvoices = quoteDocumentRepository
                .countByTipoIgnoreCaseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        DOC_TIPO_FACTURA,
                        startOfYear,
                        endExclusive);

        int missing = (int) Math.max(0, TARGET_INVOICES_MIN_YTD - currentInvoices);
        if (missing == 0) {
            return;
        }

        Customer customerA = ensureCustomer(LocalSeedNames.companyNameForSeed("demo.junio@aluon.local"),
                "demo.junio@aluon.local", "600 000 001");
        Customer customerB = ensureCustomer(LocalSeedNames.companyNameForSeed("demo.b@aluon.local"),
                "demo.b@aluon.local", "600 000 002");
        Customer customerC = ensureCustomer(LocalSeedNames.companyNameForSeed("demo.c@aluon.local"),
                "demo.c@aluon.local", "600 000 003");
        Customer customerD = ensureCustomer(LocalSeedNames.companyNameForSeed("demo.d@aluon.local"),
                "demo.d@aluon.local", "600 000 004");
        Customer customerE = ensureCustomer(LocalSeedNames.companyNameForSeed("demo.e@aluon.local"),
                "demo.e@aluon.local", "600 000 005");

        int maxExistingInvoiceSeq = quoteDocumentRepository.findMaxSequenceForDocumentPrefix(DOC_TIPO_FACTURA,
                "FA-2026-%");
        int startInvoiceSeq = Math.max(101, maxExistingInvoiceSeq + 1);
        int maxExistingQuoteSeq = quoteRequestRepository.findMaxSequenceForQuoteNumberPrefix("PT-2026-%");
        int startQuoteSeq = Math.max(101, maxExistingQuoteSeq + 1);

        List<SeedInvoicePlan> plans = buildPlans(
                List.of(customerA, customerB, customerC, customerD, customerE),
                startInvoiceSeq,
                startQuoteSeq,
                missing,
                today);

        List<QuoteItem> allItems = new ArrayList<>();
        List<QuoteDocument> allDocs = new ArrayList<>();

        for (SeedInvoicePlan plan : plans) {
            QuoteRequest quote = quoteRequestRepository.save(newQuote(
                    plan.customer,
                    plan.quoteNumber,
                    plan.quoteCreatedAt,
                    QuoteStatus.ENVIADO,
                    plan.total,
                    plan.seriesDate));

            for (SeedItemPlan item : plan.items) {
                allItems.add(quoteItem(
                        quote,
                        item.model,
                        item.type,
                        item.widthMm,
                        item.heightMm,
                        item.m2,
                        item.pricePerM2,
                        item.lineTotal));
            }

            allDocs.add(invoiceDoc(quote, plan.invoiceNumber, plan.invoiceCreatedAt, quotePdfService));
        }

        quoteItemRepository.saveAll(allItems);
        quoteDocumentRepository.saveAll(allDocs);
    }

    private Customer ensureCustomer(String nombreComercial, String email, String telefono) {
        return customerService.findFirstActiveByEmail(email)
                .map(existing -> {
                    String currentName = existing.getNombreComercial() == null ? ""
                            : existing.getNombreComercial().trim();
                    if (currentName.toLowerCase().contains("cliente demo")) {
                        existing.setNombreComercial(LocalSeedNames.companyNameForSeed(email));
                        existing.setPersonaContacto(LocalSeedNames.contactPersonForSeed(email));
                        if (existing.getTelefono() == null || existing.getTelefono().isBlank())
                            existing.setTelefono(telefono);
                        if (existing.getFormaPago() == null || existing.getFormaPago().isBlank())
                            existing.setFormaPago("TRANSFERENCIA");
                        return customerService.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> customerService.save(Customer.builder()
                        .nombreComercial(nombreComercial)
                        .personaContacto(LocalSeedNames.contactPersonForSeed(email))
                        .email(email)
                        .telefono(telefono)
                        .formaPago("TRANSFERENCIA")
                        .active(true)
                        .build()));
    }

    private static QuoteRequest newQuote(
            Customer customer,
            String quoteNumber,
            LocalDateTime createdAt,
            QuoteStatus status,
            BigDecimal total,
            LocalDate seriesDate) {
        LocalDateTime validatedAt = status == QuoteStatus.PENDIENTE_VALIDACION ? null : createdAt.plusHours(3);
        LocalDateTime sentAt = status == QuoteStatus.ENVIADO ? createdAt.plusDays(1) : null;

        return QuoteRequest.builder()
                .quoteNumber(quoteNumber)
                .seriesDate(seriesDate)
                .seriesSequence(null)
                .customer(customer)
                .tariffCode("TARIFA_DEMO")
                .contactEmail(customer.getEmail())
                .contactWhatsapp(customer.getTelefono())
                .status(status)
                .validationMode(QuoteValidationMode.MANUAL)
                .channel(QuoteChannel.EMAIL)
                .total(total)
                .createdAt(createdAt)
                .validatedAt(validatedAt)
                .sentAt(sentAt)
                .build();
    }

    private static QuoteItem quoteItem(
            QuoteRequest quote,
            DoorModel doorModel,
            DoorType doorType,
            int widthMm,
            int heightMm,
            BigDecimal m2,
            BigDecimal pricePerM2,
            BigDecimal lineTotal) {
        return QuoteItem.builder()
                .quoteRequest(quote)
                .doorModel(doorModel)
                .doorType(doorType)
                .widthMm(widthMm)
                .heightMm(heightMm)
                .unidades(1)
                .m2(m2)
                .pricePerM2(pricePerM2)
                .lineTotal(lineTotal)
                .build();
    }

    private static QuoteDocument invoiceDoc(
            QuoteRequest quote,
            String invoiceNumber,
            LocalDateTime createdAt,
            QuotePdfService quotePdfService) {
        byte[] data = quotePdfService.renderQuotePdf(quote, DOC_TIPO_FACTURA, invoiceNumber);
        return QuoteDocument.builder()
                .quoteRequest(quote)
                .tipo(DOC_TIPO_FACTURA)
                .numeroDocumento(invoiceNumber)
                .contentType("application/pdf")
                .sha256(sha256Hex(data))
                .data(data)
                .createdAt(createdAt)
                .build();
    }

    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static List<SeedInvoicePlan> buildPlans(
            List<Customer> customers,
            int startInvoiceSeq,
            int startQuoteSeq,
            int invoicesToGenerate,
            LocalDate today) {
        Random random = new Random(20260601L);

        int endMonth = today.getYear() == 2026 ? today.getMonthValue() : 12;
        int invoiceSeq = startInvoiceSeq;
        int quoteSeq = startQuoteSeq;
        List<SeedInvoicePlan> out = new ArrayList<>();

        int remaining = invoicesToGenerate;
        int monthCursor = 1;
        while (remaining > 0 && monthCursor <= endMonth) {
            int month = monthCursor;
            monthCursor += 1;

            YearMonth ym = YearMonth.of(2026, month);
            int maxDay = Math.min(28, ym.lengthOfMonth());
            if (month == today.getMonthValue() && today.getYear() == 2026) {
                maxDay = Math.min(maxDay, today.getDayOfMonth());
            }
            if (maxDay <= 0)
                continue;

            int invoicesThisMonth = Math.min(remaining, 8 + random.nextInt(8)); // 8..15
            remaining -= invoicesThisMonth;

            for (int i = 0; i < invoicesThisMonth; i += 1) {
                int day = 1 + random.nextInt(maxDay);
                int hour = 9 + random.nextInt(9);
                int minute = random.nextInt(60);

                LocalDateTime quoteCreatedAt = LocalDateTime.of(2026, month, day, hour, minute);
                int deltaDays = 1 + random.nextInt(5);
                int invoiceDay = Math.min(day + deltaDays, maxDay);
                LocalDateTime invoiceCreatedAt = LocalDateTime.of(2026, month, invoiceDay, 9 + random.nextInt(8),
                        random.nextInt(60));

                Customer customer = customers.get((month + i) % customers.size());
                String invoiceNumber = String.format("FA-2026-%04d", invoiceSeq++);
                String quoteNumber = String.format("PT-2026-%04d", quoteSeq++);

                int itemsCount = 1 + random.nextInt(3);
                List<SeedItemPlan> items = new ArrayList<>();
                for (int j = 0; j < itemsCount; j += 1) {
                    items.add(randomItemPlan(random));
                }

                out.add(plan(customer, quoteNumber, quoteCreatedAt, invoiceNumber, invoiceCreatedAt, Month.of(month),
                        items));
            }
        }

        return out;
    }

    private static SeedInvoicePlan plan(
            Customer customer,
            String quoteNumber,
            LocalDateTime quoteCreatedAt,
            String invoiceNumber,
            LocalDateTime invoiceCreatedAt,
            Month month,
            List<SeedItemPlan> items) {
        BigDecimal total = items.stream()
                .map(i -> i.lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new SeedInvoicePlan(
                customer,
                quoteNumber,
                quoteCreatedAt,
                invoiceNumber,
                invoiceCreatedAt,
                LocalDate.of(2026, month, 1),
                total,
                items);
    }

    private static SeedItemPlan randomItemPlan(Random random) {
        DoorModel model = DoorModel.values()[random.nextInt(DoorModel.values().length)];
        DoorType type = DoorType.values()[random.nextInt(DoorType.values().length)];

        int widthMm = (9 + random.nextInt(34)) * 100; // 900..4200
        int heightMm = (12 + random.nextInt(16)) * 100; // 1200..2700

        BigDecimal m2 = new BigDecimal(widthMm)
                .multiply(new BigDecimal(heightMm))
                .divide(new BigDecimal("1000000"), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal base = switch (model) {
            case PREMIUM -> new BigDecimal("205");
            case CLASSIC -> new BigDecimal("175");
            case INOX -> new BigDecimal("250");
            case VENECIANA -> new BigDecimal("120");
        };

        BigDecimal variation = new BigDecimal(String.valueOf(90 + random.nextInt(31)))
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP); // 0.90..1.20
        BigDecimal pricePerM2 = base.multiply(variation).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal lineTotal = m2.multiply(pricePerM2).setScale(2, java.math.RoundingMode.HALF_UP);

        return new SeedItemPlan(model, type, widthMm, heightMm, m2, pricePerM2, lineTotal);
    }

    private record SeedInvoicePlan(
            Customer customer,
            String quoteNumber,
            LocalDateTime quoteCreatedAt,
            String invoiceNumber,
            LocalDateTime invoiceCreatedAt,
            LocalDate seriesDate,
            BigDecimal total,
            List<SeedItemPlan> items) {
    }

    private record SeedItemPlan(
            DoorModel model,
            DoorType type,
            int widthMm,
            int heightMm,
            BigDecimal m2,
            BigDecimal pricePerM2,
            BigDecimal lineTotal) {
    }
}
