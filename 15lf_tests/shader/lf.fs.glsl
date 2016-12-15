/**
 * a phong shader implementation with texture support
 */
precision mediump float;


varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_position;

//texture related variables
varying vec2 v_texCoord;
uniform sampler2D u_diffuseTex;
uniform bool u_diffuseTexEnabled;

uniform vec4 u_lf_size;
uniform vec2 u_tex_size;
uniform vec2 u_lf_view;
uniform float u_lf_weight;


void main (void) {

	vec4 diffuseTexColor = vec4(0.0);

	if (u_diffuseTexEnabled) {
		vec2 c_view;

    // ADD CONST or DEFINE
		for( float u = 0.0; u < 9.0; u += 1.0 )
		{
			c_view.x = u;
			for( float v = 0.0; v < 9.0; v += 1.0 )
			{
				c_view.y = v;
				vec2 texCoords = v_position.xy; // v_position is in pixel coordinates (s,t)
				// pixel space coordinates to [0 1] range: (2i + 1)/(2N)
				// do nothing: texCoords = 2.0*(texCoords) + vec2( 1.0, 1.0 );
				texCoords.x = 2.0*(texCoords.x + u_lf_size.x*c_view.x) + 1.0;
				texCoords.y = 2.0*(texCoords.y + u_lf_size.y*c_view.y) + 1.0;
				texCoords.x /= 2.0*u_tex_size.x;
				texCoords.y /= 2.0*u_tex_size.y;

				diffuseTexColor += texture2D(u_diffuseTex, texCoords)*u_lf_weight;
			}
		}



	}

	gl_FragColor = vec4( diffuseTexColor.rgb, 1.0 );

}
