package com.aluon.crm.configurator.service;

import com.aluon.crm.configurator.dto.OrderConfigurationRequest;
import com.aluon.crm.configurator.model.OrderConfiguration;
import com.aluon.crm.configurator.repository.OrderConfigurationAuditRepository;
import com.aluon.crm.configurator.repository.OrderConfigurationDocumentRepository;
import com.aluon.crm.configurator.repository.OrderConfigurationFenceSectionRepository;
import com.aluon.crm.configurator.repository.OrderConfigurationRepository;
import com.aluon.core.audit.service.AdminAuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderConfigurationServicePersistenceTest {
    @Mock OrderConfigurationRepository repository;
    @Mock OrderConfigurationAuditRepository auditRepository;
    @Mock OrderConfigurationFenceSectionRepository sectionRepository;
    @Mock OrderConfigurationDocumentRepository documentRepository;
    @Mock AdminAuditService adminAuditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void persistsFenceSectionsDocumentsAndInitialAudit() {
        var payload = objectMapper.createObjectNode();
        payload.put("model", "CLASSIC");
        payload.put("verticalDimensionLabel", "ALTO");
        var sections = payload.putArray("sections");
        sections.addObject().put("widthMm", 2000).put("heightMm", 1200).put("encounterType", "NONE");
        sections.addObject().put("widthMm", 1800).put("heightMm", 1100).put("encounterType", "INNER");
        var documents = payload.putArray("generatedDocuments");
        documents.addObject().put("name", "ficha.pdf").put("type", "ORDER_CONFIGURATION_PDF");
        var request = new OrderConfigurationRequest(null, "Distribuidor DEV2", "ALUON-001", "VALLA", "DRAFT", payload, null, "Distribuidor DEV2", "ALUON-001", LocalDate.now(), "VALLA", "CLASSIC", "RAL_7016", "LACADO_MATE", "mm", null, null, null, null, "Prueba", "Instalador", "alta inicial", false);
        when(repository.save(any(OrderConfiguration.class))).thenAnswer(invocation -> {
            OrderConfiguration entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID()); entity.setCreatedAt(LocalDateTime.now()); entity.setUpdatedAt(LocalDateTime.now());
            return entity;
        });
        when(sectionRepository.findAllByConfigurationIdAndVersionOrderBySectionNumber(any(), any())).thenReturn(List.of());
        when(documentRepository.findAllByConfigurationIdAndVersionOrderByCreatedAtDesc(any(), any())).thenReturn(List.of());

        var service = new OrderConfigurationService(repository, auditRepository, sectionRepository, documentRepository, objectMapper, adminAuditService);
        var response = service.save(request);

        assertThat(response.status()).isEqualTo("DRAFT");
        verify(sectionRepository, times(2)).save(any());
        verify(documentRepository).save(any());
        var audit = ArgumentCaptor.forClass(com.aluon.crm.configurator.model.OrderConfigurationAudit.class);
        verify(auditRepository).save(audit.capture());
        assertThat(audit.getValue().getAction()).isEqualTo("CREATED");
        assertThat(audit.getValue().getChangedFields()).contains("*");
    }

    @Test
    void blocksSilentChangesInProduction() {
        var entity = OrderConfiguration.builder().id(UUID.randomUUID()).status("IN_PRODUCTION").version(2).reference("ALUON-002").productType("VALLA").payload("{}").build();
        when(repository.findById(entity.getId())).thenReturn(Optional.of(entity));
        var payload = objectMapper.createObjectNode().put("sections", "[]");
        var request = new OrderConfigurationRequest(null, "Distribuidor", "ALUON-002", "VALLA", "IN_PRODUCTION", payload, null, "Distribuidor", null, null, "VALLA", null, null, null, null, null, null, null, null, null, null, null, false);
        var service = new OrderConfigurationService(repository, auditRepository, sectionRepository, documentRepository, objectMapper, adminAuditService);

        assertThatThrownBy(() -> service.update(entity.getId(), request)).isInstanceOf(IllegalStateException.class).hasMessageContaining("autorización");
        verify(repository, never()).save(any());
    }
}
