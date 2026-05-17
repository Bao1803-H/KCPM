package com.bicap.trading_order_service.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.domain.Persistable;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "farm_manager")
public class FarmManager implements Persistable<Long> {

    @Id
    private Long id; // ID from Auth Service

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String email;

    private String role;

    // Optional: Store farm ID if this user is a farm manager
    private Long farmId;

    @OneToMany(mappedBy = "farmManager", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<MarketplaceProduct> products = new ArrayList<>();

    @Transient
    private boolean isNew = false;

    @Override
    public boolean isNew() {
        return isNew;
    }

    public void setIsNew(boolean isNew) {
        this.isNew = isNew;
    }

    public FarmManager() {
    }
}