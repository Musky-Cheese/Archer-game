extends Node3D

const BOW_SCENE := preload("res://assets/bow/la-recurve-v27.glb")
const ARROW_SCENE := preload("res://assets/bow/la-arrow-v261.glb")

func _ready() -> void:
	var bow := BOW_SCENE.instantiate()
	bow.scale = Vector3(0.72, 0.72, 0.72)
	add_child(bow)
	var arrow := ARROW_SCENE.instantiate()
	arrow.position = Vector3(-0.03, 0.10, -0.18)
	arrow.scale = Vector3(0.72, 0.72, 0.72)
	add_child(arrow)
