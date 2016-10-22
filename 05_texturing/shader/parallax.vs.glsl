// Phong Vertex Shader

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_invView;
uniform mat3 u_modelNormalMatrix;

uniform vec3 u_lightPos;

//output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying mat3 v_TBN; // Tangent Binormal Normal Matrix

//TASK 1: define output variable for texture coordinates
varying vec2 v_texCoord;

mat3 transpose(mat3 m) {
    return mat3(m[0][0], m[1][0], m[2][0],
                m[0][1], m[1][1], m[2][1],
                m[0][2], m[1][2], m[2][2]);
}

void main() {

	mat3 normalMatrix = u_modelNormalMatrix;
	vec3 N = normalize(normalMatrix * a_normal);
	vec3 T = normalize(normalMatrix * a_tangent);
	// Optionally: re-orthogonalize T with respect to N
  T = normalize(T - dot(T, N) * N);
	vec3 B = normalize(cross(N,T));

	mat3 TBN = transpose(mat3(T, B, N));


  v_normalVec = normalize(TBN * normalMatrix * a_normal);

  vec3 eyePosition = TBN * vec3( u_model * vec4(a_position,1) );
	vec4 viewPosModel = ( u_invView[3] );
	vec3 viewPos = TBN * (viewPosModel.xyz/viewPosModel.w);
	vec3 lightPos = TBN * u_lightPos;

  v_eyeVec = normalize( viewPos.xyz - eyePosition.xyz );
	v_lightVec = normalize(lightPos - eyePosition.xyz);

	//TASK 1: pass on texture coordinates to fragment shader
	v_texCoord = a_texCoord;

	gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);

}
