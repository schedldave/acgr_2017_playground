// Phong Vertex Shader in Tangent Space

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_invView;
uniform mat3 u_invViewNormalMatrix;
uniform mat4 u_invViewProjMatrix;

uniform vec3 u_lightPos;

//output of this shader
varying vec3 v_position;
varying vec3 v_viewPos;
varying vec3 v_lightPos;
varying vec2 v_texCoord; // texture coordinates

// there is no transpose in WebGL so use our own implementation:
mat3 transpose(mat3 m) {
    return mat3(m[0][0], m[1][0], m[2][0],
                m[0][1], m[1][1], m[2][1],
                m[0][2], m[1][2], m[2][2]);
}

void main() {

  // forward texture coordinates
  v_texCoord = a_texCoord;

  mat4 VRot = u_view;
  // erase the translation out of the View Matrix
  VRot[3][0] = 0.0;
  VRot[3][1] = 0.0;
  VRot[3][2] = 0.0;

  // positions in world space:
  v_viewPos = u_invView[3].xyz; //(viewPosModel.xyz/viewPosModel.w);
  v_lightPos = vec3( u_invView * vec4(u_lightPos,1) );
  vec4 worldPos = u_invViewProjMatrix * vec4( a_position.xyz, 1.0 ); //
  v_position = worldPos.xyz/worldPos.w - v_viewPos;
  // WORKS:   v_position = vec3( a_position.xy, 1.0 ); //


	gl_Position = vec4(a_position, 1.0);

}
