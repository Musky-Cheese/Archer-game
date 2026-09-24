extends CharacterBody3D

const Shape = preload("res://scripts/shape.gd")
var camera: Camera3D
var weapon: Node3D
var string_parts: Node3D
var arrow: Node3D
var hand: MeshInstance3D
var charge := 0.0
var drawing := false
var recoil := 0.0
var clock := 0.0

func _ready() -> void:
	var collider := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.3
	capsule.height = 1.8
	collider.shape = capsule
	collider.position.y = 0.9
	add_child(collider)
	camera = Camera3D.new()
	camera.position.y = 1.65
	camera.fov = 72
	camera.near = 0.025
	add_child(camera)
	camera.current = true
	weapon = Node3D.new()
	camera.add_child(weapon)
	weapon.position = Vector3(0.28, -0.25, -0.65)
	weapon.scale = Vector3.ONE * 0.65
	# A replaceable prototype weapon. The licensed laptop asset is not included.
	var points := [Vector3(0,-0.64,0.05), Vector3(-0.06,-0.52,-0.02), Vector3(-0.04,-0.34,-0.12), Vector3(0,-0.12,0), Vector3(0,0.12,0), Vector3(-0.04,0.35,-0.12), Vector3(-0.06,0.57,-0.02), Vector3(0,0.70,0.05)]
	for i in range(points.size()-1):
		Shape.rod(weapon, points[i], points[i+1], 0.025, Color("674c36"))
	Shape.box(weapon, Vector3.ZERO, Vector3(0.065,0.19,0.065), Color("272126"))
	for y in range(7):
		Shape.box(weapon, Vector3(0,-0.08+y*0.025,0.004), Vector3(0.07,0.009,0.07), Color("927455"))
	Shape.rod(weapon, Vector3(-0.02,-0.06,0.04), Vector3(-0.45,-0.5,0.65), 0.07, Color("252f37"))
	Shape.box(weapon, Vector3(-0.02,-0.05,0.04), Vector3(0.105,0.12,0.13), Color("4b3b31"))
	hand = Shape.box(weapon, Vector3(0.09,0,0.18), Vector3(0.1,0.11,0.13), Color("4b3b31"))
	string_parts = Node3D.new()
	weapon.add_child(string_parts)
	Shape.rod(string_parts, Vector3(0,-0.64,0.05), Vector3(0,0,0.08), 0.002, Color("e0cfa5"))
	Shape.rod(string_parts, Vector3(0,0,0.08), Vector3(0,0.70,0.05), 0.002, Color("e0cfa5"))
	arrow = Node3D.new()
	weapon.add_child(arrow)
	Shape.rod(arrow, Vector3(0.045,0,-0.65), Vector3(0.045,0,0.12), 0.006, Color("c5ab79"))
	Shape.box(arrow, Vector3(0.045,0,-0.66), Vector3(0.025,0.012,0.05), Color("becad0"))
	Shape.box(arrow, Vector3(0.045,0,0.04), Vector3(0.055,0.007,0.09), Color("ce754f"))
	update_string()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		drawing = false
		charge = 0
		get_parent().paused = true
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * 0.0023)
		camera.rotation.x = clampf(camera.rotation.x-event.relative.y*0.0023, -1.35, 1.35)
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
			if event.pressed:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
				get_parent().paused = false
			return
		if event.pressed:
			drawing = true
		else:
			if drawing:
				get_parent().shoot(camera, charge)
				recoil = 0.12
			drawing = false
			charge = 0

func _physics_process(delta: float) -> void:
	if get_parent().paused:
		return
	var movement := Vector2(float(Input.is_physical_key_pressed(KEY_D))-float(Input.is_physical_key_pressed(KEY_A)), float(Input.is_physical_key_pressed(KEY_S))-float(Input.is_physical_key_pressed(KEY_W)))
	var direction := basis * Vector3(movement.x, 0, movement.y).normalized()
	var speed := 6.5 if Input.is_physical_key_pressed(KEY_SHIFT) else 4.0
	velocity.x = direction.x * speed
	velocity.z = direction.z * speed
	if not is_on_floor():
		velocity.y -= 20.0 * delta
	elif Input.is_physical_key_pressed(KEY_SPACE):
		velocity.y = 6
	move_and_slide()
	clock += delta
	charge = minf(1, charge + delta/0.85) if drawing else 0.0
	recoil = move_toward(recoil, 0, delta * 0.8)
	weapon.position.y = -0.25 + sin(clock*9)*movement.length()*0.012 + charge*0.05
	weapon.position.z = -0.65 + recoil
	hand.position.z = 0.18 + charge * 0.32
	arrow.position.z = charge * 0.32
	update_string()

func update_string() -> void:
	var nock := Vector3(0,0,0.08+charge*0.32)
	Shape.position_rod(string_parts.get_child(0), Vector3(0,-0.64,0.05), nock)
	Shape.position_rod(string_parts.get_child(1), nock, Vector3(0,0.70,0.05))
