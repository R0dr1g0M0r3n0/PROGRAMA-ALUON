package com.aluon.core.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.aluon.core.user.model.User;


public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    java.util.Optional<User> findByUsername(String username);
}
