extends RefCounted

static func material(color: Color, glow: float = 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.72
	if glow > 0:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = glow
	return m

static func box(parent: Node3D, at: Vector3, size: Vector3, color: Color, solid: bool = false, glow: float = 0.0) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.material_override = material(color, glow)
	parent.add_child(node)
	node.position = at
	if solid:
		var body := StaticBody3D.new()
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		collision.shape = shape
		node.add_child(body)
		body.add_child(collision)
	return node

static func rod(parent: Node3D, a: Vector3, b: Vector3, radius: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = a.distance_to(b)
	mesh.radial_segments = 8
	node.mesh = mesh
	node.material_override = material(color)
	parent.add_child(node)
	position_rod(node, a, b)
	return node

static func position_rod(node: MeshInstance3D, a: Vector3, b: Vector3) -> void:
	node.mesh.height = a.distance_to(b)
	node.position = (a + b) * 0.5
	var direction := (b - a).normalized()
	var right := direction.cross(Vector3.FORWARD).normalized()
	if right.length_squared() < 0.1:
		right = direction.cross(Vector3.RIGHT).normalized()
	node.basis = Basis(right, direction, right.cross(direction))

static func label(parent: Node3D, words: String, at: Vector3, size: int, color: Color) -> Label3D:
	var text := Label3D.new()
	text.text = words
	text.font_size = size
	text.pixel_size = 0.008
	text.modulate = color
	text.outline_size = 2
	parent.add_child(text)
	text.position = at
	return text
