package com.aluon.production.order.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import com.aluon.production.order.model.Order;
import com.aluon.production.order.model.OrderStatus;
import com.aluon.production.order.model.OrderWorkflowStep;
import java.time.LocalDateTime;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    @EntityGraph(attributePaths = "customer")
    List<Order> findAllByOrderByCodigoOrdenDesc();

    boolean existsByCodigoOrden(String codigoOrden);

    Optional<Order> findByCodigoOrden(String codigoOrden);

    Optional<Order> findFirstByNotesOrderByCreatedAtAsc(String notes);

    long countByWorkflowStepIn(Collection<OrderWorkflowStep> steps);

    long countByEstado(OrderStatus estado);

    long countByEstadoIn(Collection<OrderStatus> estados);

    long countByWorkflowStep(OrderWorkflowStep step);

    @Query("""
            select o.workflowStep as step, count(o) as count
            from Order o
            group by o.workflowStep
            """)
    List<OrderStepCountRow> countByWorkflowStepAll();

    @Query("""
            select o.estado as status, count(o) as count
            from Order o
            group by o.estado
            """)
    List<OrderStatusCountRow> countByStatusAll();

    @Query("""
            select o.codigoOrden as codigoOrden,
                   o.estado as status,
                   o.workflowStage as workflowStage,
                   c.nombreComercial as customerName,
                   o.createdAt as createdAt,
                   u.nombre as assignedUserName
            from Order o
            join o.customer c
            left join o.assignedUser u
            order by o.createdAt desc
            """)
    List<RecentOrderRow> findRecent(Pageable pageable);

    interface OrderStepCountRow {
        OrderWorkflowStep getStep();

        long getCount();
    }

    interface OrderStatusCountRow {
        OrderStatus getStatus();

        long getCount();
    }

    interface RecentOrderRow {
        String getCodigoOrden();

        OrderStatus getStatus();

        String getWorkflowStage();

        String getCustomerName();

        LocalDateTime getCreatedAt();

        String getAssignedUserName();
    }
}
