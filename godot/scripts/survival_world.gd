extends "res://scripts/world.gd"

const Shambler = preload("res://scripts/shambler.gd")
const BILLBOARD = preload("res://assets/environment/la-billboard-large.glb")
const VENDING = preload("res://assets/environment/la-vendingmachine.glb")
const STREETLIGHT = preload("res://assets/environment/la-streetlight.glb")
const BARRICADE = preload("res://assets/environment/la-sponsoredbarricade.glb")
const CRATE = preload("res://assets/environment/la-supplycrate.glb")
const CAR = preload("res://assets/environment/la-abandonedcar.glb")

var enemies: Array[CharacterBody3D] = []
var wave := 1
var lives := 3
var kills := 0
var game_over := false
var damage_cooldown := 0.0
var damage_flash := 0.0
var next_wave_timer := -1.0
var hit_marker: Label
var game_over_label: Label
var game_over_backdrop: ColorRect

func _ready() -> void:
	training_mode = false
	super._ready()
	status = "The dead are coming. Keep moving."
	add_handoff_props()
	spawn_wave()

func build_hud() -> void:
	super.build_hud()
	var layer := hud.get_parent()
	hit_marker = Label.new()
	hit_marker.position = Vector2(610, 310)
	hit_marker.add_theme_font_size_override("font_size", 42)
	hit_marker.add_theme_color_override("font_color", Color("ffdd9e"))
	hit_marker.text = "×"
	hit_marker.visible = false
	layer.add_child(hit_marker)
	game_over_backdrop = ColorRect.new()
	game_over_backdrop.position = Vector2(390, 245)
	game_over_backdrop.size = Vector2(500, 220)
	game_over_backdrop.color = Color(0.02, 0.04, 0.07, 0.9)
	game_over_backdrop.visible = false
	layer.add_child(game_over_backdrop)
	game_over_label = Label.new()
	game_over_label.position = Vector2(390, 255)
	game_over_label.size = Vector2(500, 220)
	game_over_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	game_over_label.add_theme_font_size_override("font_size", 34)
	game_over_label.add_theme_color_override("font_color", Color("f7d3ac"))
	game_over_label.visible = false
	layer.add_child(game_over_label)

func add_prop(scene: PackedScene, at: Vector3, angle: float = 0.0) -> void:
	var prop := scene.instantiate()
	add_child(prop)
	prop.position = at
	prop.rotation.y = angle

func add_handoff_props() -> void:
	add_prop(BILLBOARD, Vector3(6.4, 0, -18), deg_to_rad(-90))
	add_prop(VENDING, Vector3(-6.1, 0, 10), deg_to_rad(90))
	add_prop(STREETLIGHT, Vector3(-5.7, 0, -5))
	add_prop(BARRICADE, Vector3(5.4, 0, -1), deg_to_rad(15))
	add_prop(CRATE, Vector3(-5.5, 0, -15))
	add_prop(CAR, Vector3(5.2, 0, -23), deg_to_rad(-12))

func spawn_wave() -> void:
	if game_over:
		return
	var count := mini(2 + wave, 8)
	for index in range(count):
		var enemy: CharacterBody3D = Shambler.new()
		enemy.target = player
		enemy.game = self
		enemy.move_speed = 1.7 + minf(0.6, float(wave - 1) * 0.13)
		add_child(enemy)
		enemy.position = Vector3(-3.1 + float(index % 3) * 3.1, 0.1, -5.0 - float(floori(float(index) / 3.0)) * 6.0 - float(wave - 1) * 2.0)
		enemies.append(enemy)
	status = "WAVE %d / %d shamblers" % [wave, count]
	status_time = 2.5

func enemy_killed(enemy: CharacterBody3D) -> void:
	enemies.erase(enemy)
	kills += 1
	score += 100
	status = "SHAMBLER DOWN / +100"
	status_time = 1.5
	if enemies.is_empty():
		next_wave_timer = 2.5
		status = "DISTRICT CLEAR / next wave incoming"

func show_hit_feedback(kill: bool) -> void:
	damage_flash = 0.18
	hit_marker.text = "✦" if kill else "×"
	hit_marker.visible = true

func damage_player(amount: int) -> void:
	if game_over or damage_cooldown > 0.0:
		return
	lives = maxi(0, lives - amount)
	damage_cooldown = 0.8
	status = "SHAMBLER HIT / KEEP MOVING"
	status_time = 1.2
	if lives == 0:
		game_over = true
		paused = true
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		game_over_label.text = "DISTRICT LOST\nSCORE %04d   •   WAVE %d\nPress R to restart" % [score, wave]
		game_over_backdrop.visible = true
		game_over_label.visible = true

func _physics_process(delta: float) -> void:
	if game_over or paused:
		return
	super._physics_process(delta)
	damage_cooldown = maxf(0.0, damage_cooldown - delta)
	if next_wave_timer >= 0.0:
		next_wave_timer -= delta
		if next_wave_timer < 0.0:
			wave += 1
			spawn_wave()

func _process(delta: float) -> void:
	super._process(delta)
	damage_flash = maxf(0.0, damage_flash - delta)
	hit_marker.visible = damage_flash > 0.0
	hud.text = "LAST ARCHER  /  NIGHT DISTRICT\nSCORE %04d     •     WAVE %d     •     HEALTH %d/3\n%d shamblers remaining  •  %d kills" % [score, wave, lives, enemies.size(), kills]
	if game_over:
		hint.text = ""
	elif paused:
		hint.text = "CLICK TO ENTER  /  mouse to look"
	else:
		hint.text = "WASD move   SHIFT sprint   SPACE jump   HOLD LMB draw / RELEASE fire   ESC pause"
	if not game_over:
		hint.text += "\n" + status
	if damage_cooldown > 0.0:
		hud.modulate = Color("ff8585")
	else:
		hud.modulate = Color.WHITE

func _unhandled_input(event: InputEvent) -> void:
	if game_over and event is InputEventKey and event.pressed and event.keycode == KEY_R:
		get_tree().reload_current_scene()

func smoke_test() -> void:
	assert(targets.is_empty())
	assert(enemies.size() == 3)
	var enemy: CharacterBody3D = enemies[0]
	enemy.move_speed = 0.0
	enemy.position = Vector3(0, 0, 4)
	paused = false
	await get_tree().physics_frame
	player.camera.look_at(enemy.global_position + Vector3(0, 1.2, 0))
	for shot in range(2):
		shoot(player.camera, 1.0)
		for frame in range(35):
			await get_tree().physics_frame
	assert(kills == 1, "Two arrows should kill one shambler")
	assert(score == 100)
	assert(enemies.size() == 2)
	damage_player(1)
	assert(lives == 2, "A shambler attack should lower health")
	print("SMOKE PASS: shambler hits, score, health, and wave setup")
	get_tree().quit()
