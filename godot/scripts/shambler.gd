extends CharacterBody3D

const MODEL = preload("res://assets/enemies/la-corner-shambler.glb")

var target: CharacterBody3D
var game: Node3D
var move_speed := 1.75
var health := 2
var attack_timer := 0.0
var stagger_timer := 0.0
var dead := false
var model: Node3D
var animation_player: AnimationPlayer

func _ready() -> void:
	set_meta("zombie", true)
	var collider := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.34
	capsule.height = 1.75
	collider.position.y = 0.88
	collider.shape = capsule
	add_child(collider)
	model = MODEL.instantiate()
	add_child(model)
	# The source GLB stores a linear palette in COLOR_0. The small lift keeps
	# its face and jacket readable under the district's dark lighting.
	var palette := ShaderMaterial.new()
	var shader := Shader.new()
	shader.code = "shader_type spatial; render_mode cull_disabled; void fragment() { ALBEDO = pow(max(COLOR.rgb, vec3(0.0)), vec3(0.45)); ROUGHNESS = 0.95; EMISSION = ALBEDO * 0.12; }"
	palette.shader = shader
	for mesh_node in model.find_children("*", "MeshInstance3D", true, false):
		var mesh_instance := mesh_node as MeshInstance3D
		if mesh_instance.mesh != null:
			for surface in range(mesh_instance.mesh.get_surface_count()):
				mesh_instance.set_surface_override_material(surface, palette)
	var players := model.find_children("*", "AnimationPlayer", true, false)
	if not players.is_empty():
		animation_player = players[0] as AnimationPlayer
	play_animation("Walk")

func _physics_process(delta: float) -> void:
	if dead or not is_instance_valid(target) or game.paused:
		return
	attack_timer = maxf(0.0, attack_timer - delta)
	stagger_timer = maxf(0.0, stagger_timer - delta)
	var toward := target.global_position - global_position
	toward.y = 0.0
	var distance := toward.length()
	if distance > 0.01:
		look_at(global_position + toward, Vector3.UP)
	if distance > 1.3 and stagger_timer <= 0.0:
		var direction := toward.normalized()
		velocity.x = direction.x * move_speed
		velocity.z = direction.z * move_speed
		play_animation("Walk")
	else:
		velocity.x = move_toward(velocity.x, 0.0, 10.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 10.0 * delta)
		play_animation("Idle")
		if distance <= 1.45 and attack_timer <= 0.0:
			game.damage_player(1)
			attack_timer = 1.35
	if not is_on_floor():
		velocity.y -= 20.0 * delta
	else:
		velocity.y = 0.0
	move_and_slide()

func take_arrow(damage: int) -> void:
	if dead:
		return
	health -= damage
	stagger_timer = 0.22
	game.show_hit_feedback(health <= 0)
	if health <= 0:
		dead = true
		remove_meta("zombie")
		collision_layer = 0
		collision_mask = 0
		if animation_player != null:
			animation_player.stop()
		var fall := create_tween()
		fall.set_parallel(true)
		fall.tween_property(model, "rotation:z", deg_to_rad(70), 0.65)
		fall.tween_property(model, "position:y", -0.45, 0.65)
		game.enemy_killed(self)
		await get_tree().create_timer(1.2).timeout
		queue_free()

func play_animation(wanted: String) -> void:
	if animation_player == null:
		return
	for name in animation_player.get_animation_list():
		if String(name).to_lower().contains(wanted.to_lower()):
			if animation_player.current_animation != name:
				animation_player.play(name)
			return
