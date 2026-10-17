package com.aluon.core.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.aluon.core.user.model.ContractType;
import com.aluon.core.user.model.Role;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String nombre;
    private String apellidos;
    private String email;
    private Integer telefono;
    private Role role;
    private String horario;
    private ContractType tipoContrato;
    private String fotoBase64;
    private Boolean active;
}
