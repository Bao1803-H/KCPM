package com.bicap.farm_management.controller;

import com.bicap.farm_management.entity.EnvironmentMetric;
import com.bicap.farm_management.service.EnvironmentMetricService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/environment-metrics")
@CrossOrigin(origins = "*")
@Tag(name = "Environment Metrics", description = "APIs for managing farm environment metrics")
public class EnvironmentMetricController {
    
    private final EnvironmentMetricService metricService;

    public EnvironmentMetricController(EnvironmentMetricService metricService) {
        this.metricService = metricService;
    }

    @Operation(summary = "Add a new metric manually", description = "Records a specific environment metric (e.g., Soil Moisture) for a batch.")
    @PostMapping("/batch/{batchId}")
    public EnvironmentMetric addMetric(@PathVariable Long batchId, @RequestBody EnvironmentMetric metric) {
        return metricService.addMetric(batchId, metric);
    }

    @Operation(summary = "Get metrics by batch", description = "Retrieves all recorded metrics for a specific production batch.")
    @GetMapping("/batch/{batchId}")
    public List<EnvironmentMetric> getMetricsByBatch(@PathVariable Long batchId) {
        return metricService.getMetricsByBatch(batchId);
    }

    @Operation(summary = "Sync weather from external API", description = "Fetches current weather (Temp, Humidity) and saves it as metrics for the batch.")
    @PostMapping("/sync-weather/{batchId}")
    public List<EnvironmentMetric> syncWeather(@PathVariable Long batchId) {
        return metricService.syncWeatherFromApi(batchId);
    }
}