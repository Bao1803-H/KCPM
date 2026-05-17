package com.bicap.farm_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bicap.farm_management.entity.Farm;
import com.bicap.farm_management.repository.FarmRepository;

import java.util.List;

@Service
public class FarmService {
    @Autowired
    private FarmRepository farmRepository;

    public Farm createFarm(Farm farm) {
        return farmRepository.save(farm);
    }

    public List<Farm> getAllFarms() {
        return farmRepository.findAll();
    }
}