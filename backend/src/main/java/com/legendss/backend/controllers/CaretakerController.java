package com.legendss.backend.controllers;

import com.legendss.backend.entities.Caretaker;
import com.legendss.backend.services.CaretakerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/caretakers")
@CrossOrigin("*")
public class CaretakerController {
    private final CaretakerService caretakerService;

    public CaretakerController(CaretakerService caretakerService) {
        this.caretakerService = caretakerService;
    }

    @PostMapping("/add")
    public Caretaker addCaretakerController(@RequestBody Caretaker caretaker, @RequestAttribute("email") String userEmail) {
        return this.caretakerService.addCaretaker(caretaker, userEmail);
    }

    @GetMapping("/get/{id}")
    public Caretaker getCaretakerController(@PathVariable Long id) {
        return this.caretakerService.getCaretakerById(id);
    }

    @GetMapping("/get/all")
    public List<Caretaker> getAllCaretakersController() {
        return this.caretakerService.getAllCaretakers();
    }

    @PatchMapping("/update/{id}")
    public Caretaker updateCaretakerController(@PathVariable Long id, @RequestBody Caretaker caretaker) {
        caretaker.setId(id);
        return this.caretakerService.updateCaretaker(caretaker);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteCaretakerController(@PathVariable Long id) {
        this.caretakerService.deleteCaretakerById(id);
    }
}
