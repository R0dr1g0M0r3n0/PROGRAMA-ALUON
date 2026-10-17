package com.aluon.crm.catalog.service;

import com.aluon.crm.catalog.dto.CatalogRuleValidationRequest;
import com.aluon.crm.catalog.model.CatalogRule;
import com.aluon.crm.catalog.repository.CatalogRuleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogRuleValidationServiceTest {
    @Mock CatalogRuleRepository repository;

    @Test
    void validatesPeatonalUsingTheConfiguredMatrix() throws Exception {
        var mapper = new ObjectMapper();
        var matrix = CatalogRule.builder().id(UUID.randomUUID()).productType("PUERTA_PEATONAL").ruleKey("TEMPLATE_MATRIX")
                .ruleValue("{\"requiredFields\":[\"hingeSide\"],\"enumFields\":{\"hingeSide\":[\"LEFT\",\"RIGHT\"]},\"messages\":{\"hingeSide\":\"Seleccione la bisagra.\"}}")
                .active(true).build();
        when(repository.findAllByProductTypeAndActiveTrueOrderByRuleKeyAsc("PUERTA_PEATONAL")).thenReturn(List.of(matrix));

        var response = new CatalogRuleValidationService(repository).validate(new CatalogRuleValidationRequest("PUERTA_PEATONAL", mapper.readTree("{\"hingeSide\":\"LEFT\"}")));

        assertThat(response.valid()).isTrue();
        assertThat(response.errors()).isEmpty();
    }

    @Test
    void returnsClearErrorForMissingConfiguredField() throws Exception {
        var mapper = new ObjectMapper();
        var matrix = CatalogRule.builder().id(UUID.randomUUID()).productType("ABATIBLE_DOS").ruleKey("TEMPLATE_MATRIX")
                .ruleValue("{\"requiredFields\":[\"activeLeaf\"],\"messages\":{\"activeLeaf\":\"Seleccione una única primera hoja de apertura.\"}}")
                .active(true).build();
        when(repository.findAllByProductTypeAndActiveTrueOrderByRuleKeyAsc("ABATIBLE_DOS")).thenReturn(List.of(matrix));

        var response = new CatalogRuleValidationService(repository).validate(new CatalogRuleValidationRequest("ABATIBLE_DOS", mapper.readTree("{}")));

        assertThat(response.valid()).isFalse();
        assertThat(response.errors()).containsExactly("Seleccione una única primera hoja de apertura.");
    }
}
