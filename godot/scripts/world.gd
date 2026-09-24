extends Node3D

const Shape = preload("res://scripts/shape.gd")
const Player = preload("res://scripts/player.gd")
const ADS = {
	"BILLBOARD_01": "ZOMBIE INSURANCE\nCoverage ends upon death.",
	"VENDING_01": "REVIVE\nENERGY",
	"BARRICADE_SPONSOR": "BUNKER / SAFE ZONE",
	"CRATE_SPONSOR": "ARROW PRIME",
	"WALL_AD_01": "BRAINS?\nTHERE'S AN APP FOR THAT.",
	"ROAD_SIGN_01": "SURVIVING?\nADVERTISE HERE."
}
var player: CharacterBody3D
var paused := true
var targets: Array[StaticBody3D] = []
var arrows: Array[Dictionary] = []
var hud: Label
var hint: Label
var meter: ProgressBar
var score := 0
var shots := 0
var hits := 0
var status := "Training district / shoot the green targets"
var status_time := 0.0

func _ready() -> void:
	build_world()
	player = Player.new()
	player.name = "Archer"
	add_child(player)
	player.position = Vector3(0,0.2,13)
	build_hud()
	if "--smoke-test" in OS.get_cmdline_user_args():
		call_deferred("smoke_test")
	if "--capture" in OS.get_cmdline_user_args():
		call_deferred("capture")

func build_world() -> void:
	var environment := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_COLOR
	settings.background_color = Color("0b1320")
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	settings.ambient_light_color = Color("829ab8")
	settings.ambient_light_energy = 0.55
	settings.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.environment = settings
	add_child(environment)
	var moon := DirectionalLight3D.new()
	moon.rotation_degrees = Vector3(-48,-25,0)
	moon.light_color = Color("a3bbd1")
	moon.light_energy = 0.7
	moon.shadow_enabled = true
	add_child(moon)
	Shape.box(self, Vector3(0,-0.2,0), Vector3(22,0.4,64), Color("202a31"), true)
	for side in [-1,1]:
		Shape.box(self, Vector3(side*7,0.06,0), Vector3(3,0.12,60), Color("424953"), true)
		for block in range(6):
			var z := 19.0-block*9.0
			var height := 7.0+float(block%3)*2.0
			var color := Color("34414d") if block%2==0 else Color("4e4144")
			Shape.box(self, Vector3(side*11,height/2,z), Vector3(5,height,8.6), color, true)
			for floor_index in range(2,5):
				for column in range(3):
					var window := Shape.box(self, Vector3(side*8.46, floor_index*1.6, z-2.7+column*2.6), Vector3(0.06,0.9,0.9), Color("aa8857") if (block+column+floor_index)%3==0 else Color("142330"), false, 0.5)
					window.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			Shape.box(self, Vector3(side*8.35,1.3,z), Vector3(0.18,2.4,5.5), Color("27333a"))
			for slat in range(12):
				Shape.box(self, Vector3(side*8.22,0.25+slat*0.18,z), Vector3(0.06,0.025,5.4), Color("57616b"))
			Shape.box(self, Vector3(side*7.9,2.65,z), Vector3(1,0.16,6), Color("715b49"))
		for index in range(4):
			var z := 15.0-index*13.0
			Shape.rod(self, Vector3(side*5.8,0,z), Vector3(side*5.8,4.8,z), 0.065, Color("414951"))
			Shape.box(self, Vector3(side*5.5,4.8,z), Vector3(0.8,0.12,0.25), Color("ffd09a"), false, 2)
			var lamp := OmniLight3D.new()
			lamp.position = Vector3(side*5.3,4.3,z)
			lamp.light_color = Color("ffbc73")
			lamp.light_energy = 2.3
			lamp.omni_range = 8
			add_child(lamp)
	Shape.box(self, Vector3(0,4,-31), Vector3(22,8,1), Color("28343f"), true)
	Shape.box(self, Vector3(0,2,31), Vector3(22,4,1), Color("28343f"), true)
	for index in range(20):
		Shape.box(self, Vector3(0,0.008,27-index*3), Vector3(0.1,0.008,1.5), Color("ad9870"))
	for index in range(5):
		var p := Vector3(-3.5+float(index%2)*7,0,-1-index*5)
		create_target(p)
	for index in range(6):
		var key: String = ADS.keys()[index]
		var z := 12.0-index*7.5
		var sign_position := Vector3(-6.8 if index%2==0 else 6.8, 2.5,z)
		Shape.box(self, sign_position, Vector3(3.4,1.4,0.15), Color("192930"), true)
		Shape.label(self, ADS[key], sign_position+Vector3(0,0,0.09), 27, Color("efd0a0"))
		Shape.rod(self, sign_position-Vector3(0,2.5,0), sign_position, 0.08, Color("51585e"))
	for index in range(8):
		Shape.box(self, Vector3(4.5 if index%2==0 else -4.5,0.4,18-index*6), Vector3(0.7,0.8,0.7), Color("555748"), true)
	Shape.label(self, "NIGHT DISTRICT / 07", Vector3(0,5,-30.4), 70, Color("c39568"))

func create_target(at: Vector3) -> void:
	var target := StaticBody3D.new()
	add_child(target)
	target.position = at
	target.set_meta("target",true)
	var collider := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(0.85,2.0,0.5)
	collider.shape = shape
	collider.position.y = 1
	target.add_child(collider)
	Shape.box(target, Vector3(0,0.6,0), Vector3(0.08,1.2,0.08), Color("79664c"))
	Shape.box(target, Vector3(0,1.2,0), Vector3(0.8,0.75,0.22), Color("486650"))
	Shape.box(target, Vector3(0,1.78,0), Vector3(0.38,0.42,0.26), Color("8aaf7d"))
	for side in [-1,1]:
		Shape.box(target, Vector3(side*0.10,1.82,0.14), Vector3(0.06,0.035,0.02), Color("defa9f"), false, 1)
	Shape.label(target, "TRAINING", Vector3(0,2.3,0), 20, Color("9bb69e"))
	targets.append(target)

func build_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	hud = Label.new()
	hud.position = Vector2(32,24)
	hud.add_theme_font_size_override("font_size",22)
	hud.add_theme_color_override("font_color",Color("ead4ac"))
	layer.add_child(hud)
	hint = Label.new()
	hint.position = Vector2(32,624)
	hint.add_theme_font_size_override("font_size",18)
	layer.add_child(hint)
	var crosshair := Label.new()
	crosshair.text = "+"
	crosshair.position = Vector2(632,345)
	crosshair.add_theme_font_size_override("font_size",24)
	crosshair.modulate = Color("eed7b0")
	layer.add_child(crosshair)
	meter = ProgressBar.new()
	meter.position = Vector2(560,405)
	meter.size = Vector2(160,5)
	meter.max_value = 1
	meter.show_percentage = false
	layer.add_child(meter)

func shoot(camera: Camera3D, strength: float) -> void:
	shots += 1
	var projectile := Node3D.new()
	add_child(projectile)
	projectile.global_transform = camera.global_transform
	projectile.position -= camera.global_basis.z*0.5
	Shape.rod(projectile, Vector3.ZERO, Vector3(0,0,0.6), 0.008, Color("d4bc86"))
	arrows.append({"node":projectile,"velocity":-camera.global_basis.z*lerpf(18,48,strength),"age":0.0})

func _physics_process(delta: float) -> void:
	if paused:
		return
	for i in range(arrows.size()-1,-1,-1):
		var item: Dictionary = arrows[i]
		var node: Node3D = item.node
		item.age += delta
		item.velocity.y -= 5.0*delta
		var end: Vector3 = node.position+item.velocity*delta
		var query := PhysicsRayQueryParameters3D.create(node.position,end)
		query.exclude = [player.get_rid()]
		var result := get_world_3d().direct_space_state.intersect_ray(query)
		if not result.is_empty():
			if result.collider.has_meta("target"):
				hits += 1
				score += 100
				status = "TARGET DOWN / +100"
				status_time = 2
				targets.erase(result.collider)
				result.collider.queue_free()
			node.queue_free()
			arrows.remove_at(i)
		elif item.age > 5:
			node.queue_free()
			arrows.remove_at(i)
		else:
			node.position = end
			node.look_at(end+item.velocity)
	if Input.is_physical_key_pressed(KEY_R) and targets.is_empty():
		for index in range(5):
			create_target(Vector3(-3.5+float(index%2)*7,0,-1-index*5))
		status = "Training targets reset"

func _process(delta: float) -> void:
	status_time = maxf(0,status_time-delta)
	hud.text = "LAST ARCHER  /  NIGHT DISTRICT\nGODOT STUDY 01     •     SCORE %04d\n%d / 5 targets remaining" % [score,targets.size()]
	hint.text = "CLICK TO ENTER  /  mouse to look" if paused else "WASD move   SHIFT sprint   SPACE jump   HOLD LMB draw / RELEASE fire   ESC pause"
	hint.text += "\n" + ("Range cleared. Press R to reset targets." if targets.is_empty() else status)
	meter.value = player.charge
	meter.visible = player.drawing

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		paused = true
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		if is_instance_valid(player):
			player.drawing = false
			player.charge = 0

func smoke_test() -> void:
	assert(targets.size() == 5)
	assert(player.camera != null)
	paused = false
	await get_tree().physics_frame
	player.camera.look_at(targets[0].global_position+Vector3(0,1.35,0))
	shoot(player.camera,1)
	for i in range(120):
		await get_tree().physics_frame
	assert(hits == 1, "Charged arrow should hit first target")
	assert(score == 100)
	assert(player.is_on_floor(), "Player should land on street collision")
	print("SMOKE PASS: five targets, projectile collision, score, grounded player")
	get_tree().quit()

func capture() -> void:
	for i in range(12):
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://preview.png")
	get_tree().quit()
