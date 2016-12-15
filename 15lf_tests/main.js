/**
 *
 */
'use strict';

var gl = null;
const camera = {
  rotation: {
    x: 0,
    y: 0
  }
};

//scene graph nodes
var root = null;
var quad = null;


// full size of light field texture
var texSize = 8192;
// dimensions of light field (4D)
var lfSize = { u : 9, v : 9, s : 768, t : 768};
var lf_texture_file = 'models/lfpersp8192.png';

// aperture and center of light field
var aperture = null;
var lfCenter = [(lfSize.u-1)/2.0, (lfSize.v-1)/2.0];


//load the required resources using a utility function
loadResources({
  vs: 'shader/lf.vs.glsl',
  fs: 'shader/lf.fs.glsl',
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  texture_diffuse: 'models/wood.png',
  lf_texture: lf_texture_file,
  model: 'models/C-3PO.obj'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);
  initLF(resources);
  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext(lfSize.s,lfSize.t,true); // create canvas in size of lf and keep the size (don't resize)


  // disable depth test for our use case
  gl.disable(gl.DEPTH_TEST);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);

  //create scenegraph
  root = createSceneGraph(gl, resources);

  initInteraction(gl.canvas);
}

function initLF(resources){

 aperture = new Array(lfSize.u);
  for(var u = 0; u < lfSize.u; u ++ ){
    aperture[u] = new Array(lfSize.v);
    for(var v = 0; v < lfSize.v; v ++ ){
        aperture[u][v] = 1.0/(lfSize.u*lfSize.v);
    }
  }


  for(var u = 0; u < lfSize.u; u ++ ){
    aperture[u] = new Array(lfSize.v);
    for(var v = 0; v < lfSize.v; v ++ ){
        aperture[u][v] = 0.0;
        if(( u==lfCenter[0] && v==lfCenter[1] )
          || ( u==0 && v==0 )){
          aperture[u][v] = 1.0/2.0;
        }
        ///(lfSize.u*lfSize.v);
    }
  }

  // ToDo:
  // append shader defines to shader source code!

}

function createSceneGraph(gl, resources) {



  //create shader
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));

  {
    //initialize screen spaced quad

    quad = new LFSGNode( lfSize, [texSize, texSize],
      new TextureSGNode(resources.lf_texture, 0, 'u_diffuseTex',
                      new RenderSGNode(makeScreenQuad())
      ));


    root.append( quad );
  }


  return root;
}

function makeScreenQuad() {
  var width = 1;
  var height = 1;
  var position = [0, 0, 0,  lfSize.s, 0, 0,   lfSize.s, lfSize.t, 0,   0, lfSize.t, 0];
  var normal = [0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1];
  var texturecoordinates = [0, 0,   1, 0,   1, 1,   0, 1];
  //var texturecoordinates = [0, 0,   5, 0,   5, 5,   0, 5];
  var index = [0, 1, 2,   2, 3, 0];
  return {
    position: position,
    normal: normal,
    texture: texturecoordinates,
    index: index
  };
}

class LFSGNode extends SGNode {

  constructor( lfsize, texsize, children ) {
    super( children );
    this.lfsize = [lfsize.s,lfsize.t,lfsize.u,lfsize.v];
    this.texsize = texsize;
    this.currentview = [3, 3];
    this.currentweight = 1.0;

    //set of additional lights to set the uniforms
    this.lights = [];
  }

  setLFUniforms(context) {
    const gl = context.gl;
    //no materials in use
    //if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, 'u_lf_size'))) {
    //  return;
    //}
    gl.uniform4fv(gl.getUniformLocation( context.shader, 'u_lf_size' ), this.lfsize);
    gl.uniform2fv(gl.getUniformLocation( context.shader, 'u_tex_size' ), this.texsize);
    gl.uniform2fv(gl.getUniformLocation(context.shader,  'u_lf_view' ), this.currentview);
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_lf_weight'), this.currentweight);

  }

  render(context) {
    this.setLFUniforms(context);

    //render children
    super.render(context);

  }
}


function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  //setup viewport
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup context and camera matrices
  const context = createSGContext(gl);
  //context.projectionMatrix = mat4.perspective(mat4.create(), convertDegreeToRadians(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.projectionMatrix = mat4.ortho(mat4.create(), 0.0,lfSize.s, lfSize.t,0.0,-1.0,1.0);
  //very primitive camera implementation
  let lookAtMatrix = mat4.create(); // mat4.lookAt(mat4.create(), [0,4,-8], [0,0,0], [0,1,0]);
  context.viewMatrix = lookAtMatrix; // mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);

  //update animations
  context.timeInMilliseconds = timeInMilliseconds;

  //render quad + shader (in root)

  // render quad
  quad.currentweight = 1.0/(lfSize.u*lfSize.v);
  root.render(context);

  // for(var u = 0; u < lfSize.u; u ++ ){
  //   for(var v = 0; v < lfSize.v; v ++ ){
  //     quad.currentview = [u, v];
  //     quad.currentweight = aperture[u][v];
  //
  //
  //   }
  // }


  //root.render(context);

  //root.render(context);

  //quad.render(context);

  //animate
  requestAnimationFrame(render);
}

//camera control
function initInteraction(canvas) {
  const mouse = {
    pos: { x : 0, y : 0},
    leftButtonDown: false
  };
  function toPos(event) {
    //convert to local coordinates
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  canvas.addEventListener('mousedown', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function(event) {
    const pos = toPos(event);
    const delta = { x : mouse.pos.x - pos.x, y: mouse.pos.y - pos.y };
    if (mouse.leftButtonDown) {
      //add the relative movement of the mouse to the rotation variables
  		camera.rotation.x += delta.x;
  		camera.rotation.y += delta.y;
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });
  //register globally
  document.addEventListener('keypress', function(event) {
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if (event.code === 'KeyR') {
      camera.rotation.x = 0;
  		camera.rotation.y = 0;
    }
  });
}

function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}
