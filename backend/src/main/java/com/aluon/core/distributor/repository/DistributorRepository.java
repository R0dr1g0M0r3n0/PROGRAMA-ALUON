package com.aluon.core.distributor.repository;

import com.aluon.core.distributor.model.Distributor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DistributorRepository extends JpaRepository<Distributor, UUID> {
    List<Distributor> findAllByOrderBySortOrderAscNameAsc();
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
}
