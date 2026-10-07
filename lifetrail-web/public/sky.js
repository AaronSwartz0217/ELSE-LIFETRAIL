/* LifeTrail 天光背景 · 片段着色器
 * 把 Frank Hugenroth 的 ShaderToy「Clouds / Water」原样搬到页面当背景：
 * 体素云 + 上帝光 + 会反射天空的水面。只在「天光」主题下开启，
 * 由右上角旋钮第 4 档触发（window.LifeTrailSky.setActive(true)）。
 *
 * 依赖：WebGL2（GLSL ES 3.00，用得到 textureLod）。拿不到就静默退出，
 * 页面退回 --bg 兜底色，不影响其它功能。零第三方依赖，逻辑纯手写。
 * 性能：海面是逐像素光线步进（每像素上百步），所以画布按 RES_SCALE 降分辨率渲染以保帧率。
 * 但海浪是很细的细节，降太狠会把浪糊没了——0.7 是「还看得见浪」与帧率的折中点，可自行调大调小。 */
(function () {
  const canvas = document.getElementById('skyCanvas');
  if (!canvas) return;
  let RES_SCALE = 0.7;     // 分辨率缩放：海浪是很细的细节，半分辨率会把波浪糊掉，提到 0.7
  const MAX_W = 1440;      // 再宽的屏也只渲染到这个宽度，避免大屏拖垮帧率

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false });
  if (!gl) { canvas.remove(); return; }   // 无 WebGL2：直接撤掉画布，用兜底色

  // 确认这帧是 GPU 出的：读真实渲染器名。软件渲染（SwiftShader / llvmpipe）说明
  // 浏览器硬件加速被关了，会又慢又糊，这时进一步降分辨率兜底。
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'unknown';
  const soft = /swiftshader|software|llvmpipe|basic render/i.test(renderer);
  console.info(`[sky] WebGL2 渲染器：${renderer}${soft ? '（软件渲染，硬件加速未启用）' : ''}`);
  if (soft) { RES_SCALE = 0.35; console.warn('[sky] 检测到软件渲染，云海背景已降分辨率兜底'); }

  const VS = `#version 300 es
    in vec2 aPos;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FS = `#version 300 es
    precision highp float;
    uniform vec3  iResolution;
    uniform float iTime;
    uniform sampler2D iChannel0;
    out vec4 outColor;

    // Clouds: slice based volumetric height-clouds with god-rays, density, sun-radiance/shadow
    // and Water: simple reflecting sky/sun and cloud shaded height-modulated waves
    // Created by Frank Hugenroth 03/2013
    // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    // noise and raymarching based on concepts and code from shaders by inigo quilez

    #define RENDER_GODRAYS 1
    #define RENDER_CLOUDS  1
    #define RENDER_WATER   1

    float waterlevel = 70.0;
    float wavegain   = 1.0;
    float large_waveheight = 1.0;
    float small_waveheight = 1.0;

    vec3 fogcolor    = vec3( 0.5, 0.7, 1.1 );
    vec3 skybottom   = vec3( 0.6, 0.8, 1.2 );
    vec3 skytop      = vec3( 0.05, 0.2, 0.5 );
    vec3 reflskycolor= vec3( 0.025, 0.10, 0.20 );
    vec3 watercolor  = vec3( 0.2, 0.25, 0.3 );
    vec3 light       = normalize( vec3( 0.1, 0.25, 0.9 ) );

    // random/hash function
    float hash( float n ) { return fract(cos(n)*41415.92653); }

    // 2d noise function
    float noise( vec2 p ) { return textureLod(iChannel0,p*vec2(1.0/256.0),0.0).x; }

    // 3d noise function
    float noise( in vec3 x )
    {
      vec3 p  = floor(x);
      vec3 f  = smoothstep(0.0, 1.0, fract(x));
      float n = p.x + p.y*57.0 + 113.0*p.z;
      return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                     mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                 mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                     mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
    }

    mat3 m = mat3( 0.00,  1.60,  1.20, -1.60,  0.72, -0.96, -1.20, -0.96,  1.28 );

    // Fractional Brownian motion
    float fbm( vec3 p )
    {
      float f = 0.5000*noise( p ); p = m*p*1.1;
      f += 0.2500*noise( p ); p = m*p*1.2;
      f += 0.1666*noise( p ); p = m*p;
      f += 0.0834*noise( p );
      return f;
    }

    mat2 m2 = mat2(1.6,-1.2,1.2,1.6);

    // Fractional Brownian motion
    float fbm( vec2 p )
    {
      float f = 0.5000*noise( p ); p = m2*p;
      f += 0.2500*noise( p ); p = m2*p;
      f += 0.1666*noise( p ); p = m2*p;
      f += 0.0834*noise( p );
      return f;
    }

    // this calculates the water as a height of a given position
    float water( vec2 p )
    {
      float height = waterlevel;

      vec2 shift1 = 0.001*vec2( iTime*160.0*2.0, iTime*120.0*2.0 );
      vec2 shift2 = 0.001*vec2( iTime*190.0*2.0, -iTime*130.0*2.0 );

      // coarse crossing 'ocean' waves...
      float wave = 0.0;
      wave += sin(p.x*0.021  + shift2.x)*4.5;
      wave += sin(p.x*0.0172+p.y*0.010 + shift2.x*1.121)*4.0;
      wave -= sin(p.x*0.00104+p.y*0.005 + shift2.x*0.121)*4.0;
      // ...added by some smaller faster waves...
      wave += sin(p.x*0.02221+p.y*0.01233+shift2.x*3.437)*5.0;
      wave += sin(p.x*0.03112+p.y*0.01122+shift2.x*4.269)*2.5 ;
      wave *= large_waveheight;
      wave -= fbm(p*0.004-shift2*.5)*small_waveheight*24.;
      // ...added by some distored random waves (which makes the water looks like water :)
      float amp = 6.*small_waveheight;
      shift1 *= .3;
      for (int i=0; i<7; i++)
      {
        wave -= abs(sin((noise(p*0.01+shift1)-.5)*3.14))*amp;
        amp *= .51;
        shift1 *= 1.841;
        p *= m2*0.9331;
      }

      height += wave;
      return height;
    }

    // cloud intersection raycasting
    float trace_fog(in vec3 rStart, in vec3 rDirection )
    {
    #if RENDER_CLOUDS
      // makes the clouds moving...
      vec2 shift = vec2( iTime*80.0, iTime*60.0 );
      float sum = 0.0;
      // use only 12 cloud-layers ;)
      float q2 = 0., q3 = 0.;
      for (int q=0; q<10; q++)
      {
        float c = (q2+350.0-rStart.y) / rDirection.y;
        vec3 cpos = rStart + c*rDirection + vec3(831.0, 321.0+q3-shift.x*0.2, 1330.0+shift.y*3.0);
        float alpha = smoothstep(0.5, 1.0, fbm( cpos*0.0015 ));
        sum += (1.0-sum)*alpha;
        if (sum>0.98) break;
        q2 += 120.;
        q3 += 0.15;
      }
      return clamp( 1.0-sum, 0.0, 1.0 );
    #else
      return 1.0;
    #endif
    }

    // fog and water intersection function.
    bool trace(in vec3 rStart, in vec3 rDirection, in float sundot, out float fog, out float dist)
    {
      float h = 20.0;
      float t = 0.0;
      float st = 1.0;
      float alpha = 0.1;
      float asum = 0.0;
      vec3 p = rStart;

      for( int j=1000; j<1120; j++ )
      {
        // some speed-up if all is far away...
        if( t>500.0 )       st = 2.0;
        else if( t>800.0 )  st = 5.0;
        else if( t>1000.0 ) st = 12.0;

        p = rStart + t*rDirection;

    #if RENDER_GODRAYS
        if (rDirection.y>0. && sundot > 0.001 && t>400.0 && t < 2500.0)
        {
          alpha = sundot * clamp((p.y-waterlevel)/waterlevel, 0.0, 1.0) * st * 0.024*smoothstep(0.80, 1.0, trace_fog(p,light));
          asum  += (1.0-asum)*alpha;
          if (asum > 0.9) break;
        }
    #endif

        h = p.y - water(p.xz);

        if( h<0.1 ) // hit the water?
        {
          dist = t;
          fog = asum;
          return true;
        }

        if( p.y>450.0 ) // lost in space? quit...
          break;

        // speed up ray if possible...
        if(rDirection.y > 0.0)
          t += 30.0 * st;
        else
          t += max(1.0,1.0*h)*st;
      }

      dist = t;
      fog = asum;
      if (h<10.0) return true;
      return false;
    }

    vec3 camera( float time )
    {
      return vec3( 500.0 * sin(1.5+1.57*time), 0.0, 1200.0*time );
    }

    void main()
    {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 xy = -1.0 + 2.0*fragCoord.xy / iResolution.xy;
      vec2 s = xy*vec2(1.75,1.0);

      // get camera position and view direction
      float time = (iTime+13.5+44.)*.05;
      vec3 campos = camera( time );
      vec3 camtar = camera( time + 0.4 );
      campos.y = max(waterlevel+30.0, waterlevel+90.0 + 60.0*sin(time*2.0));
      camtar.y = campos.y*0.5;

      float roll = 0.14*sin(time*1.2);
      vec3 cw = normalize(camtar-campos);
      vec3 cp = vec3(sin(roll), cos(roll),0.0);
      vec3 cu = normalize(cross(cw,cp));
      vec3 cv = normalize(cross(cu,cw));
      vec3 rd = normalize( s.x*cu + s.y*cv + 1.6*cw );

      float sundot = clamp(dot(rd,light),0.0,1.0);

      vec3 col;
      float fog=0.0, dist=0.0;

      if (!trace(campos,rd,sundot, fog, dist))
      {
        // render sky
        float t = pow(1.0-0.7*rd.y, 15.0);
        col = 0.8*(skybottom*t + skytop*(1.0-t));
        // sun
        col += 0.47*vec3(1.6,1.4,1.0)*pow( sundot, 350.0 );
        // sun haze
        col += 0.4*vec3(0.8,0.9,1.0)*pow( sundot, 2.0 );

    #if RENDER_CLOUDS
        // CLOUDS
        vec2 shift = vec2( iTime*80.0, iTime*60.0 );
        vec4 sum = vec4(0,0,0,0);
        for (int q=1000; q<1100; q++) // 100 layers
        {
          float c = (float(q-1000)*12.0+350.0-campos.y) / rd.y;
          vec3 cpos = campos + c*rd + vec3(831.0, 321.0+float(q-1000)*.15-shift.x*0.2, 1330.0+shift.y*3.0);
          float alpha = smoothstep(0.5, 1.0, fbm( cpos*0.0015 ))*.9;
          vec3 localcolor = mix(vec3( 1.1, 1.05, 1.0 ), 0.7*vec3( 0.4,0.4,0.3 ), alpha);
          alpha = (1.0-sum.w)*alpha;
          sum += vec4(localcolor*alpha, alpha);
          if (sum.w>0.98) break;
        }
        float alpha = smoothstep(0.7, 1.0, sum.w);
        sum.rgb /= sum.w+0.0001;

        sum.rgb -= 0.6*vec3(0.8, 0.75, 0.7)*pow(sundot,13.0)*alpha;
        sum.rgb += 0.2*vec3(1.3, 1.2, 1.0)* pow(sundot,5.0)*(1.0-alpha);

        col = mix( col, sum.rgb , sum.w*(1.0-t) );
    #endif

        // add god-rays
        col += vec3(0.5, 0.4, 0.3)*fog;
      }
      else
      {
    #if RENDER_WATER
        // render water
        vec3 wpos = campos + dist*rd;
        vec2 xdiff = vec2(0.1, 0.0)*wavegain*4.;
        vec2 ydiff = vec2(0.0, 0.1)*wavegain*4.;

        rd = reflect(rd, normalize(vec3(water(wpos.xz-xdiff) - water(wpos.xz+xdiff), 1.0, water(wpos.xz-ydiff) - water(wpos.xz+ydiff))));
        float refl = 1.0-clamp(dot(rd,vec3(0.0, 1.0, 0.0)),0.0,1.0);

        float sh = smoothstep(0.2, 1.0, trace_fog(wpos+20.0*rd,rd))*.7+.3;
        float wsky   = refl*sh;
        float wwater = (1.0-refl)*sh;

        float sundot = clamp(dot(rd,light),0.0,1.0);

        col = wsky*reflskycolor;
        col += wwater*watercolor;
        col += vec3(.003, .005, .005) * (wpos.y-waterlevel+30.);

        // Sun
        float wsunrefl = wsky*(0.5*pow( sundot, 10.0 )+0.25*pow( sundot, 3.5)+.75*pow( sundot, 300.0));
        col += vec3(1.5,1.3,1.0)*wsunrefl;
    #endif

        // global depth-fog
        float fo = 1.0-exp(-pow(0.0003*dist, 1.5));
        vec3 fco = fogcolor + 0.6*vec3(0.6,0.5,0.4)*pow( sundot, 4.0 );
        col = mix( col, fco, fo );

        // add god-rays
        col += vec3(0.5, 0.4, 0.3)*fog;
      }

      outColor = vec4(col,1.0);
    }`;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[sky] 着色器编译失败：', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[sky] 着色器链接失败：', gl.getProgramInfoLog(prog));
    canvas.remove(); return;
  }
  gl.useProgram(prog);

  // 覆盖全屏的单个大三角形，比两个三角形少一条对角线的插值
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // iChannel0：256×256 白噪声贴图，与 ShaderToy 原版一致。
  // 着色器的 water() 靠这张图的 noise(vec2) 逐层（7 层）做出细碎的浪，
  // 之前把它换成过平滑的值噪声，浪也被磨平了，这里还原回白噪声。
  const N = 256, px = new Uint8Array(N * N * 4);
  for (let i = 0; i < px.length; i++) px[i] = (Math.random() * 256) | 0;
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const uRes = gl.getUniformLocation(prog, 'iResolution');
  const uTime = gl.getUniformLocation(prog, 'iTime');
  gl.uniform1i(gl.getUniformLocation(prog, 'iChannel0'), 0);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = false, raf = 0, t0 = performance.now();

  function resize() {
    const w = Math.max(2, Math.min(MAX_W, Math.floor(innerWidth * RES_SCALE)));
    const h = Math.max(2, Math.floor(innerHeight * RES_SCALE));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function draw(now) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform3f(uRes, canvas.width, canvas.height, 1);
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(now) {
    if (!active) return;
    resize();
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  // 仅在天光主题开启时跑：关闭即刻停帧，不空转 GPU
  window.LifeTrailSky = {
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) {
        resize();
        if (reduced) { draw(performance.now()); return; }   // 尊重「减少动态效果」：只画一帧静图
        t0 = performance.now();
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf); raf = 0;
      }
    }
  };
  addEventListener('resize', () => { if (active && !reduced) resize(); });
})();