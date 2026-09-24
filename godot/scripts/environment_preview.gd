extends Node3D

const BILLBOARD := preload("res://assets/environment/la-billboard-large.glb")
const VENDING := preload("res://assets/environment/la-vendingmachine.glb")
const STREETLIGHT := preload("res://assets/environment/la-streetlight.glb")
const BARRICADE := preload("res://assets/environment/la-sponsoredbarricade.glb")
const CRATE := preload("res://assets/environment/la-supplycrate.glb")
const CAR := preload("res://assets/environment/la-abandonedcar.glb")

func add_prop(scene: PackedScene, position: Vector3, rotation_y := 0.0) -> void:
	var prop := scene.instantiate()
	prop.position = position
	prop.rotation.y = rotation_y
	add_child(prop)

func _ready() -> void:
	add_prop(BILLBOARD, Vector3(5.5, 0.0, -7.0), deg_to_rad(-12.0))
	add_prop(VENDING, Vector3(-5.2, 0.0, -2.5), deg_to_rad(90.0))
	add_prop(STREETLIGHT, Vector3(-4.2, 0.0, 1.0))
	add_prop(BARRICADE, Vector3(1.0, 0.0, -5.0), deg_to_rad(8.0))
	add_prop(CRATE, Vector3(3.4, 0.0, 2.0), deg_to_rad(-18.0))
	add_prop(CAR, Vector3(-2.8, 0.0, -8.5), deg_to_rad(-8.0))
