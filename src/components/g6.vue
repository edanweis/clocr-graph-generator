<!--  -->
<template>
  <main class="main" ref="main">
    <!-- <div style="z-index:4; position: absolute;left:10px;top:10px;"></div>   -->
    <div v-if="(showDOMBboxes && graph)">

      <div :data-cls="renderNodes.find(rn=>rn.id == n.getContainer().id)?.cls" id="renderedNodes" v-for="n, i in graph.getNodes()" :class="['dom-node', 'renderedNode']" :style="{
                    left: graph.getClientByPoint(p(n).x, p(n).y).x+'px',
                    top: graph.getClientByPoint(p(n).x, p(n).y).y+'px',
                    width: `${graph.getClientByPoint(p(n).maxX, p(n).maxY).x - 
            graph.getClientByPoint(p(n).minX, p(n).minY).x}px`,
            height: `${graph.getClientByPoint(p(n).maxX, p(n).maxY).y - 
              graph.getClientByPoint(p(n).minX, p(n).minY).y}px`,
        border: '0px solid transparent', color: 'transparent', background: 'transparent'
      }">
        
        {{renderNodes.find(rn=>rn.id == n.getContainer().id)?.cls}}
      </div>
      
      <div :data-id="e.getContainer().cfg.id" :data-cls="renderEdges.find( re => re.id == e.getContainer().cfg.id )?.cls" v-for="e, i in graph.getEdges()" :class="['dom-node', 'renderedEdge']" :style="{
                        left: graph.getClientByPoint(b(e).x, b(e).y).x+'px',
                        top: graph.getClientByPoint(b(e).x, b(e).y).y+'px',
                        width: `${graph.getClientByPoint(b(e).maxX, b(e).maxY).x - 
                graph.getClientByPoint(b(e).minX, b(e).minY).x}px`,
                height: `${graph.getClientByPoint(b(e).maxX, b(e).maxY).y - 
                  graph.getClientByPoint(b(e).minX, b(e).minY).y}px`,
      border: '0px solid transparent',  color: 'transparent', background: 'transparent'}">
    <!-- {{ e.getContainer().cfg.id }} -->
    {{ renderEdges.find( re => re.id == e.getContainer().cfg.id )?.cls }}
    <!-- {{e.getBBox()}} -->
  </div>
</div>

    <div ref="canvas" class="wrapper" :style="{filter: `grayscale(${Math.random()>0.8? 1 : 0})`}"></div>
    
    <div  :style="{opacity: automation?0:1}" class="buttons-wrapper">
      <button id="random" ref="saveButton"  @click="saveNGraphs">random</button>
      &nbsp;
      <button @click="showBboxes = !showBboxes; saveNGraphs()">{{showBboxes? 'hide' : 'show'}} bounding boxes</button>
      {{ automation }}
    </div>
    <!-- <div style="position: absolute; background-color: red; width: 100px; height: 100px">
      {{domboxes[0]}}
    </div> -->
    <pre v-if="currentbboxes" :style="{'font-size': automation?'0px':'10px'}">{{ currentbboxes.join('\n').replaceAll(' ','\t')}}</pre>
    <!-- <pre v-if="currentbboxes" style="font-size: 12px;">{{ normalNodes}}</pre> -->
    <!-- <pre v-if="currentbboxes" style="font-size: 12px;">{{ loopEdges}}</pre> -->
    <!-- <pre v-if="currentbboxes && showBboxes" style="font-size: 12px;">{{ bboxes}}</pre>-->
  </main>
</template>

<script>
import G6 from '@antv/g6';
import randomColor from 'randomcolor';
import generate from '@/mixins/generateGraphs.js';
import { readableColor } from 'color2k';
import { ext } from '@antv/matrix-util';
import { timeout } from 'd3-timer';
import debounce from "lodash.debounce"
import { saveAs } from 'file-saver';
import { isArray } from '@antv/util';
import { calcCtrlPoints } from "bezier-control-points";
// text inside loop symbols
// 

const getCircleCenterByPoints = (p1, p2, p3) => {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;
  const c = p1.x - p3.x;
  const d = p1.y - p3.y;
  const e = (p1.x * p1.x - p2.x * p2.x - p2.y * p2.y + p1.y * p1.y) / 2;
  const f = (p1.x * p1.x - p3.x * p3.x - p3.y * p3.y + p1.y * p1.y) / 2;
  const denominator = b * c - a * d;
  return {
    x: -(d * e - b * f) / denominator,
    y: -(a * f - c * e) / denominator,
  };
};

const distance = (p1, p2) => {
  const vx = p1.x - p2.x;
  const vy = p1.y - p2.y;
  return Math.sqrt(vx * vx + vy * vy);
};

export default {
  mixins: [generate],
  data() {  
    return {
      renderNodes: [],
      renderEdges: [],
      loopEdges: [],
      normalEdges: [],
      normalNodes: [],
      polarities: [],
      p_leg: {
          '+': 's',
          '–': 'o',
          '-': 'o',
          'S': 's',
          'P': 's',
          'O': 'o',
          's': 's',
          'p': 's',
          'o': 'o',
        },
      renderCounter: 0,
      counter: 0,
      showBboxes: false,
      showDOMBboxes: true,
      canvasWidth: null,
      canvasHeight: null,
      csize: null,
      bboxes: [],
      domboxes: [],
      currentbboxes: '',
      automation: false,
      classes: {
        variable: 0,
        ne_arrow_s: 1,
        nw_arrow_s: 2,
        se_arrow_s: 3,
        sw_arrow_s: 4,
        ne_arrow_o: 5,
        nw_arrow_o: 6,
        se_arrow_o: 7,
        sw_arrow_o: 8,
        r_loop: 9,
        b_loop: 10,
        s: 11,
        o: 12,
        '+': 13,
        '-': 14,
        ne_arrow: 15, 
        nw_arrow: 16,
        se_arrow: 17,
        sw_arrow: 18,
      },
      windowHeight: null,
      windowWidth: null,
      graphs: [],
      c: null,
      currentGraph: null,
      totalLoopSymbols: 0,
    }
  },
  created() {
    window.addEventListener("resize", this.resizeHandler);
    window.addEventListener("keydown", this.onKeydown);

    // check if query string automation is true without vue-router
    
    
  },
  destroyed() {
    window.removeEventListener("resize", this.resizeHandler);
    window.removeEventListener("keydown", this.onKeydown);
  },
  mounted() {  
    
    this.automation = window.location.search.includes('automation=true')

    // get nested canvas element from vue $ref
    
    
    
    
    var self=this;
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
    const transform = ext.transform;
    this.$refs.saveButton.click()
    
    G6.registerNode( // random image
      'random-image',
      {
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1]

          // change original shape
          group.get('children')[0].attr({
            stroke: 'transparent',
            fill: 'transparent',
          });
        
          const img = group.addShape('image', {
            attrs: {
              img: `https://loremflickr.com/${width}/${width}?lock=${self.getRandom(1, 9999)}&random=1`,
              x: -width / 2,
              y: -height / 2,
            },
            name: 'random-image-shape',
          });
        },
      },

      'ellipse',
    );
    
    G6.registerNode( // paragraph
      'paragraph',
      {
        options: {
          textAlign: 'left',
          size: [200,200]
        },
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1]

          group.get('children')[0].attr({
            stroke: 'transparent',
            fill: 'transparent',
            
          });
          
          
        
          const symbol = group.addShape('text', {
            attrs: {
              fill: cfg.style.stroke,
              textAlign: 'left',
              labelCfg: {
                style: {
                  textAlign: 'left',
                },
              },
              textBaseline: 'middle',
              fontSize: 20,
              x: 0,
              y: 0,
            },
            name: 'loop-text',
          })
        },
      },

      'ellipse',
    );

    G6.registerNode( // ellipse-rect
      'ellipse-rect',
      {
        // draw(cfg, group) {
        //   console.log(cfg.x);
        //   // self.getCoords(cfg.x, cfg.y, cfg.size[0], cfg.size[1])
        // },
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1];
          const scale = 0.8
          
          group.get('children')[0].attr({
            stroke: 'transparent',
            fill: 'transparent',
            rx: width*0.8,
            ry: height*0.8,
          });

          const labelBBox = group.getBBox();
          
          const keyShape = group.addShape('rect', {
            attrs: {
              ...cfg.style,
              // stroke: 'transparent',
              stroke: 'transparent',
              fill: 'red',
              opacity: self.showBboxes ? 0.1 : 0,
              x: -(labelBBox.width * scale)/2,
              y: -(labelBBox.height * scale)/2,
              width: labelBBox.width*scale,
              height: labelBBox.height*scale
              
            },
            draggable: true,
          });
          let r = self.sample([self.getRandom(5, labelBBox.height * scale / 2), 0], [0.2, .8])
          let c = self.sample([randomColor({ luminosity: 'dark' }), self.sample(['black', 'grey'])], [0.2, .8])
          const rectShape = group.addShape('rect', {
            attrs: {
              // ...cfg.style,
              // stroke: 'transparent',
              stroke: c,
              lineWidth: self.getRandom(0.2,4),
              radius: [r,r],
              fill: 'white',
              x: -(labelBBox.width * scale)/2,
              y: -(labelBBox.height * scale)/2,
              width: labelBBox.width*scale,
              height: labelBBox.height*scale
              
            },
            draggable: true,
          });

          
          // console.log(self.normalNodes);
          // console.log(self.graph)
          // console.log(group.getCanvasBBox())
          
          // push bbox
          let b = keyShape.getBBox()
          let clientBBox = {
            x: self.graph.getClientByPoint(b.x, b.y).x,
            y: self.graph.getClientByPoint(b.x, b.y).y,
            maxX: self.graph.getClientByPoint(b.maxX, b.maxY).x,
            maxY: self.graph.getClientByPoint(b.maxX, b.maxY).y,
            minX: self.graph.getClientByPoint(b.minX, b.minY).x,
            minY: self.graph.getClientByPoint(b.minX, b.minY).y
          }

          self.normalNodes.push({id: cfg.id, bbox: clientBBox, type: 'normalNode' })
          
          keyShape.toFront()
          rectShape.toBack()
          // console.log('pushing variable', cfg.id);
          

        },
      },

      'ellipse',
    );

    G6.registerNode( // rect
      'rect',
      {
        // draw(cfg, group) {
        //   console.log(cfg.x);
        //   // self.getCoords(cfg.x, cfg.y, cfg.size[0], cfg.size[1])
        // },
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1];
          const scale = 0.8

          group.get('children')[0].attr({
            stroke: 'transparent',
            rx: width * 0.8,
            ry: height * 0.8,
          });

          const labelBBox = group.getBBox();

          const keyShape2 = group.addShape('rect', {
            attrs: {
              ...cfg.style,
              stroke: cfg.style.stroke,
              //stroke width
              lineWidth: cfg.style.lineWidth,
              // stroke: 'transparent',
              fill: 'transparent',
              // opacity: self.showBboxes ? 0.1 : 0,
              x: -(labelBBox.width * scale) / 2,
              y: -(labelBBox.height * scale) / 2,
              width: labelBBox.width * scale,
              height: labelBBox.height * scale

            },
            draggable: true,
          });

          const keyShape = group.addShape('rect', {
            attrs: {
              ...cfg.style,
              // stroke: 'transparent',
              stroke: 'blue',
              fill: 'red',
              opacity: self.showBboxes ? 0.1 : 0,
              x: -(labelBBox.width * scale) / 2,
              y: -(labelBBox.height * scale) / 2,
              width: labelBBox.width * scale,
              height: labelBBox.height * scale

            },
            draggable: true,
          });


          // console.log(self.normalNodes);
          // console.log(self.graph)
          // console.log(group.getCanvasBBox())

          // push bbox
          let b = keyShape.getBBox()
          let clientBBox = {
            x: self.graph.getClientByPoint(b.x, b.y).x,
            y: self.graph.getClientByPoint(b.x, b.y).y,
            maxX: self.graph.getClientByPoint(b.maxX, b.maxY).x,
            maxY: self.graph.getClientByPoint(b.maxX, b.maxY).y,
            minX: self.graph.getClientByPoint(b.minX, b.minY).x,
            minY: self.graph.getClientByPoint(b.minX, b.minY).y
          }

          self.normalNodes.push({ id: cfg.id, bbox: clientBBox, type: 'normalNode' })

          keyShape.toFront()
          keyShape2.toFront()

          // console.log('pushing variable', cfg.id);


        },
      },

      'rect',
    );

    G6.registerNode( // ellipse-padded
      'ellipse-padded',
      {
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1];
          // console.log(cfg)
          
          group.get('children')[0].attr({
            stroke: 'transparent',
            fill: 'transparent',
            // rx: width*0.9,
            // ry: height*0.9,
          });

          
          const keyShape = group.addShape('ellipse', {
            attrs: {
              ...cfg.style,
              stroke: randomColor({luminosity: 'dark'}),
              // fill: 'transparent',
              ry: height*0.5,
              rx: width*0.5,
            },
            draggable: true,
          });

          const labelBBox = keyShape.getBBox();

          // console.log({...group.get('children')[0].cfg.parent.cfg});
          

          const bbox = group.addShape('rect', {
            attrs: {
              ...cfg.style,
              // stroke: 'transparent',
              stroke: 'transparent',
              fill: self.showBboxes ? 'red' : 'transparent',
              opacity: 0.1,
              x: -(labelBBox.width) / 2,
              y: -(labelBBox.height) / 2,
              width: labelBBox.width,
              height: labelBBox.height

            },
            draggable: true,
          });

          // push bbox
          self.normalNodes.push({ id: cfg.id, bbox: keyShape.getBBox(), type: 'normalNode' })
        
          keyShape.toBack()
          bbox.toFront()

        },
        update: undefined
      },
      // Extend the 'single-node'
      'ellipse',
    );
 
    G6.registerEdge( // loopEdge
      'loopEdge', {
        // clockwise: self.sample([0,1]),
        // curveOffset: 20,
        // getControlPoints(cfg) {
          
        // },
        // getPath(points) {
        //   const path = [];
        //   path.push(['M', points[0].x, points[0].y]);
        //   if (points.length === 2) {
        //     path.push(['L', points[1].x, points[1].y]);
        //   } else {
        //     path.push([
        //       'A',
        //       points[1].x,
        //       points[1].y,
        //       0,
        //       0,
        //       this.clockwise,
        //       points[2].x,
        //       points[2].y,
        //     ]);
        //   }
        //   return path;
        // },
        // curveOffset: 1000,
      options: {
        style: {
          
          stroke: '#000',
        },
      },
      labelAutoRotate: true,
      draw(cfg, group) { 
        // draw a quadratic bezier curve
        const startPoint = cfg.startPoint;
        const endPoint = cfg.endPoint;
        // derrive midPoint at 0.5 of the line
        const midPoint = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2,
        };
        // Find a point at a given perpendicular distance from the midPoint on the line.
        // offset is proportional to line length
        const lineLength = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2));
        let offset = self.remapValue(lineLength, 100, 200, 0, 50) * self.sample([1, 1])
        let controlPoint = self.getOffsetPoint(midPoint, endPoint, offset)
        const path = [
          ['M', startPoint.x, startPoint.y],
          ['Q', controlPoint.x, controlPoint.y, endPoint.x, endPoint.y],
        ];
        const shape = group.addShape('path', {
          attrs: {
            ...cfg.style,
            path,
          },
          name: 'path-shape',
        });
        return shape;
      },
      afterDraw(cfg, group) {
        const shape = group.get('children')[0];
        // change shape
        const startPoint = shape.getPoint(0);
        const midPoint = shape.getPoint(0.5);
        const endPoint = shape.getPoint(0.9);
        const length = shape.cfg.totalLength

        const p = self.sample(['+', '–', '-', 's', 'p', 'o', 'S', 'P', 'O'])
        
        self.polarities.push({id: cfg.id, polarity: self.p_leg[p]})

        let radian = Math.atan((startPoint.y - endPoint.y) / ((startPoint.x - endPoint.x)));
        if (length < 100) {
          // set attribute
          shape.attr({
            stroke: 'transparent',
            text: length < 100 ? 'hide' : 'show',
            style: {
              endArrow: false,
              startArrow: false
            }
          });
          shape.hide()
          // this.setState('selected', true);
          
        } else {

          if (self.showBboxes) {
            // add new group

            group.addShape('text', {
              attrs: {
                text: self.getBearing(startPoint, endPoint),
                fill: 'red',
                opacity: 0.6,
                textAlign: 'start',
                textBaseline: 'middle',
                fontVariant: 'normal',
                fontSize: 20,
                x: endPoint.x,
                y: endPoint.y,
              },
              name: 'polarity-text-shape',
            });

          }
          let arrowWidth = self.getRandom(5, 10);
          let arrowLength = arrowWidth * self.getRandom(1, 3)

          shape.attr({

            endArrow: self.sample([true, {
              fillOpacity: Math.random() > 0.9 ? 0.5 : 1,
              fill: cfg.style.stroke,
              path: self.sample([
                G6.Arrow.triangle(arrowWidth, arrowLength),
                // G6.Arrow.vee(self.getRandom(5, 15), self.getRandom(2, 20), 0),
                // G6.Arrow.circle(this.getRandom(2, 6), 0)
              ])
            }]),

          });


          const polarity = group.addShape('text', {
            attrs: {
              text: p,
              fill: cfg.style.stroke,
              textAlign: 'start',
              textBaseline: 'middle',
              fontVariant: self.sample(['bold', 'normal'], [0.7,0.3]),
              fontSize: self.sample([10,15,20]),
              x: endPoint.x - self.sample([20, -20]) * Math.cos(radian + Math.PI / 2),
              y: endPoint.y - self.sample([20, -20]) * Math.sin(radian + Math.PI / 2),
            },
            name: 'polarity-text-shape',
          });
          let matrix = polarity.getMatrix();
          if (!matrix) matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

          const polarityMatrix = transform(matrix, [
            ['t', 0, 0], // translate
            ['s', 1, 1],
          ]);
          polarity.setMatrix(polarityMatrix);

          if (Math.random() > 0.8) {

            const delay = group.addShape('text', {
              attrs: {
                text: '‖',
                fill: cfg.style.stroke,
                textAlign: 'start',
                textBaseline: 'middle',
                fontWeight: 100,
                fontFamily: 'Lato',
                fontSize: 40,
                x: midPoint.x,
                y: midPoint.y,
              },
              name: 'polarity-text-shape',
            });

            delay.rotateAtStart(radian);

          }


          

          let { maxX, maxY, minX, minY } = group.getBBox()
          
          group.addShape('rect', {
            attrs: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
              fill: self.showBboxes ? 'red' : 'transparent',
              opacity: self.showBboxes ? 0.1: 0,
              stroke: 'transparent',
            },
            draggable: false,
            name: 'bbox-polarity-shape',
          });
          

          

          // push bbox
          self.normalEdges.push({id: cfg.id, bbox: polarity.getBBox(), type: 'normalEdge' })
          


        }

        if (length > 300 && self.totalLoopSymbols < 7) {
          self.totalLoopSymbols += 1


          // shape.attr({
          //   stroke: 'transparent',
          //   endArrow: false,
          // });

          // const stroke = (cfg.style && cfg.style.stroke) || this.options.style.stroke;

          let size = 60

          // the init matrix for a shape or a group is null, initiate it with unit matrix

          let bracket = Math.random() > 0.8

          let n = self.getRandom(1, 38)
            const loop = group.addShape('image', {
              attrs: {
                img: bracket ? 'blank.png' : `arrows/${self.sample(['a', 'b'])}/${n}.png`,
                opacity: bracket ? 0 : 1,
                x: midPoint.x - size / 2,
                y: midPoint.y - size / 2,
                width: size,
                height: size,
              },
              name: 'loop-image',
            });
            
          
          // push bbox
          self.loopEdges.push({id: cfg.id, image: `arrows/${n}.png`, bbox: group.getBBox(), type: 'loopEdge' })
          

          let bracketStart = bracket ?  '(' : ''
          let bracketEnd = bracket ?  ')' : ''

          let loopText = bracketStart + self.sample([self.sample(['–', '—', '-']), '+', self.sample(['R', 'B']) + self.sample([self.getRandom(1, 20)])]) + bracketEnd
          
          if (loopText.length<=5){
            var loopTextSize = loopText.startsWith('R') || loopText.startsWith('B') ? 18 : 30
          } else{
            var loopTextSize = 10
          }
          // check if loopText starts with R or B
          let loopFontWeight = loopText.startsWith('R') || loopText.startsWith('B') ? 400 : 200

          
          // const symbolCaption = group.addShape('text', {
          //   attrs: {
          //     text: `${self.randomWords(2)}\n${self.randomWords(2)}`,
          //     // fill: cfg.style.stroke,
          //     fill: self.sample(['black', 'red', 'blue']),
          //     textAlign: 'center',
          //     textBaseline: 'middle',
          //     fontSize: random(8, 60),
          //     fontWeight: loopFontWeight,
          //     x: midPoint.x,
          //     y: midPoint.y //- (size / 2),
          //   },
          //   name: 'loop-text-caption',
          // })
          
          // if cfg.labelCfg.text includes a "p"
          const symbol = group.addShape('text', {
            attrs: {
              text: loopText,
              // fill: cfg.style.stroke,
              fill: self.sample(['black', 'red', 'blue']),
              textAlign: 'center',
              textBaseline: 'middle',
              fontSize: loopTextSize,
              fontWeight: loopFontWeight,
              x: midPoint.x,
              y: midPoint.y //- (size / 2),
            },
            name: 'loop-text',
          })

          group.addShape('text', {
            attrs: {
              text: self.sample([`${self.randomWords(2)}\n${self.randomWords(2)}`, '']),
              // fill: cfg.style.stroke,
              fill: self.sample(['black', 'red', 'blue']),
              textAlign: 'center',
              textBaseline: 'middle',
              fontSize: 15,
              fontWeight: loopFontWeight,
              x: midPoint.x-100,
              y: midPoint.y
            },
            name: 'loop-text',
          })
          

          let matrix = loop.getMatrix();
          if (!matrix) matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

          const symbolMatrix = transform(matrix, [
            ['t', -100, -50], // translate
            ['s', 1, 1],
          ]);


          // const loopMatrix = transform(matrix, [
          //   ['t', -100,-50], // translate
          //   ['s', 1, 1],
          //   ['r', 10, 1],
          // ]);

          symbol.setMatrix(symbolMatrix);
          loop.setMatrix(symbolMatrix);




          if (self.showBboxes) {
            let { maxX, maxY, minX, minY } = loop.getBBox()

            group.addShape('rect', {
              attrs: {
                x: minX - 100,
                y: minY - 50,
                width: maxX - minX,
                height: maxY - minY,
                stroke: 'red',
                lineWidth: 1,
              },
              name: 'loop-shape',
            })
          }

          // loop.setMatrix(loopMatrix);


        } else{

        }



        return shape;
      },
      update: undefined


    }, 'quadratic'
    )

  },
  methods: {

    getOffsetPoint(midPoint, endPoint, offset) {
      let x1 = midPoint.x
      let y1 = midPoint.y
      let x2 = endPoint.x
      let y2 = endPoint.y
      let N = offset

      var dx = x1 - x2
      var dy = y1 - y2
      let dist = Math.sqrt(dx * dx + dy * dy)
      dx = dx/dist
      dy = dy/dist

      let x3 = x1 + N * dy
      let y3 = y1 - N * dx
      let x4 = x1 - N * dy
      let y4 = y1 + N * dx
      // console.log([x4, y4])
      return {x: x3, y: y3}
    },

    p(n){
      return n.getBBox()
    },

    b(e){
      return e.getContainer().getBBox()
    },

    saveToTextFile(padded_counter){
      // write bboxes to a csv file
      var blob = new Blob([this.currentbboxes.join('\n')], { type: "text/plain;charset=utf-8" });
      
      saveAs(blob, `${padded_counter}.txt`);

    },  

    getArcControlPoints(curveOffset, startPoint, midPoint, endPoint){
      const vec = {
        x: endPoint.x - startPoint.x,
        y: endPoint.y - startPoint.y,
      };
      
      const edgeAngle = Math.atan2(vec.y, vec.x);

      let arcPoint = {
        x: curveOffset * Math.cos(-Math.PI / 2 + edgeAngle) + midPoint.x,
        y: curveOffset * Math.sin(-Math.PI / 2 + edgeAngle) + midPoint.y,
      };

      let pointsToPassThrough = [
        [startPoint.x, startPoint.y],
        [arcPoint.x, arcPoint.y],
        [endPoint.x, endPoint.y]
      ];

      return calcCtrlPoints(pointsToPassThrough).map((point) => {
        return {
          x: point[0],
          y: point[1],
        }
      })

      

    },
  
    getBearing(startPoint, endPoint) {
      // if endPoint x is greater than startPoint x, then it's east
      const east = endPoint.x > startPoint.x
      // if endPoint y is greater than startPoint y, then it's south
      const south = endPoint.y > startPoint.y
      // if endPoint x is less than startPoint x, then it's west
      const west = endPoint.x < startPoint.x
      // if endPoint y is less than startPoint y, then it's north
      const north = endPoint.y < startPoint.y
      // determine the quadrant of the bearing
      const quadrant = (east && south) ? 'se' : (east && north) ? 'ne' : (west && north) ? 'nw' : 'sw'
      return quadrant
    },

    
    pushBBox(bbox, c){     
      var { x, y, minX, maxX, minY, maxY, width, height } = bbox
      let cls = this.classes[c]
      var centerX = (x + width / 2) / this.canvasWidth; 
      var centerY = (y + height / 2) / this.canvasHeight;
      
      width = width / this.canvasWidth
      height = height / this.canvasHeight
      
      // this.domboxes.push(
      //   {
      //     left: this.graph.getClientByPoint(x, y).x + 'px',
      //     top: this.graph.getClientByPoint(x, y).y + 'px',
      //     width: `${this.graph.getClientByPoint(maxX, maxY).x -
      //       this.graph.getClientByPoint(minX, minY).x}px`,
      //     height: `${this.graph.getClientByPoint(maxX, maxY).y -
      //       this.graph.getClientByPoint(minX, minY).y}px`,
      //     // height: n.getBBox().height+'px',
      //   })
      
      this.bboxes.push(`${c} ${centerX} ${centerY} ${width} ${height}`)
      this.currentbboxes.push(`${c} ${centerX} ${centerY} ${width} ${height}`)     
      
    },

    onKeydown(event) {
      if (event.code === "Enter") {
        this.domboxes = []
        this.$refs.saveButton.click()
        
      }
    },
    saveNGraphs(){
      this.csize = this.sample([1600/2, 1280/2, 800/2], [0.6, 0.2, 0.2])
      this.canvasWidth = this.csize
      this.canvasHeight = this.csize
      this.counter +=1
      this.currentbboxes = []
      let g = this.generateRandomGraphs(1)
      let p = this.styleGraph(g[0])
      this.drawGraph(p, this.causalLoopStyle(), this.counter)
      
      // const cv = this.$refs.canvas.getElementsByTagName('canvas')[0]
      // // set the canvas width and height to the graph width and height
      // cv.style.transformOrigin = 'top left'
      // // cv.style.transform = `scale(${640/this.csize})`
      // // resize canvas to enlarge pixels to 640x640
      // cv.width = this.csize
      // cv.height = this.csize
      // cv.style.transformOrigin = 'top left'
      // cv.style.width = `${this.csize}px`
      // cv.style.height = `${this.csize}px`
      // cv.style.transform = `scale(${640/this.csize})`
      


    

    },

    remapValue(value, low1, high1, low2, high2) {
      return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    },
    
    styleGraph(g) {
      var self = this;
      var cls = self.causalLoopStyle()
      
      var g = {
        nodes: g.nodes.map(n => {
          return {
            ...n,
            id: n.key,
            label: this.sample([`${this.randomWords(2)}\n${this.randomWords(2)}`.toUpperCase(),
                                `${this.randomWords(2)}\n${this.randomWords(2)}`], [0.5,0.5])
            // comboId: this.sample(['a', 'b'])
          }
        }),
        // combos: [
        //   { // define comboA
        //     id: 'a',
        //     label: 'A',
        //     parentId: 'a',
        //     size: 100,
        //     type: 'circle'
        //   },
        //   { // define comboB
        //     id: 'b',
        //     label: 'A',
        //     parentId: 'b',
        //     size: 100,
        //     type: 'circle'
        //   }
        // ],
        edges: g.edges.map(e => {

          return {
            ...e,
            // comboId: this.sample(['a', 'b']),
            // label: ['',self.sample(['', '-'])],
            // symbol: Math.random() > 0.95 ? true : false,
            style: {
              ...cls.defaultEdge.style,
              lineWidth: Math.random() > 0.9 ? this.getRandom(2, 5) : this.getRandom(1, 2),
              stroke: Math.random() > 0.9 ? randomColor({ luminosity: 'bright' }) : cls.defaultEdge.style.stroke, 
              lineDash: Math.random() > 0.1 ? null : [5,5],

            },
            source: e.source,
            target: e.target,
          }
        })
      }
      
      return g
    },
  
    drawGraph(g, style, name) {
      var self = this
      if (this.graph) {
        this.graph.destroy()
        this.totalLoopSymbols = 0
      }        
        this.graph = new G6.Graph({
          animation: false,
          container: this.$refs.canvas,
          width: this.canvasWidth,
          height: this.canvasHeight,
          fitCenter: true,
          fitView: true,
          fitViewPadding: 20,
          // gpuEnabled: true,
          // preventOverlap: {padding: 20},
          modes: {
            default: ['drag-canvas'  , 'zoom-canvas', 'drag-node'],
          },
          ...style
        })

        this.graph.fitCenter(180)


      this.graph.data({
        nodes: g.nodes,
        edges: g.edges,
      });

      this.graph.updateLayout({
                
        // maxIteration: 50,
        type: 'forceAtlas2',
        width: this.canvasWidth, 
        height: this.canvasHeight,
        onLayoutEnd: (e) => {
          // workaround strange double render issue
          
          if (this.renderCounter == 1) {
            this.pushNodeBBoxes()
            this.pushEdgeBBoxes()
            
            setTimeout(() => {
              let padded_counter = this.counter.toString().padStart(6, '0')  
              let renderedNodes = document.getElementsByClassName('renderedNode');
              let renderedEdges = document.getElementsByClassName('renderedEdge');
              Array.from(renderedEdges).map(re=> {
                

              })
              
              // console.log(`${this.getBearing(re.e.getModel().startPoint, re.e.getModel().endPoint)}_arrow_${polarity}`)

              Array.from(renderedNodes).filter(rn=>rn.innerText).map(rn => this.pushBBox(rn.getBoundingClientRect(), 1))
              
              Array.from(renderedEdges).filter(rn => rn.innerText).map(re => {
                var self = this
                let pol = this.p_leg[this.graph.getEdges().find(e => e.getContainer().cfg.id == re.attributes['data-id'].value).getContainer().findAll(function (item) {
                  return item.attr('text') // get all the elements with the id smaller than 10
                })[0].attr('text')]
                console.log();
                
                let classname = `${re.attributes['data-cls'].value.slice(0, 2)}_arrow_${pol}`
                let classcat = this.classes[`${re.attributes['data-cls'].value.slice(0, 2)}_arrow_${pol}`]

                this.pushBBox(re.getBoundingClientRect(), classcat)
              })
              // uncomment to save:
              // this.graph.downloadImage(`${padded_counter}`, 'image/jpeg', 'white')
              // this.saveToTextFile(padded_counter)

            }, 10);
            
            
            this.renderCounter = 0
          } else{
            this.renderCounter += 1
          }
          
          // get the node divs by classname renderedNodes
          // for (let n of renderedNodes){
          //   console.log(n.getBoundingClientRect())
          // }
          
          // get the dom bounding boxes of each node in renderedNodes
          

        },
        fitView: true,
        linkDistance: this.getRandom(100,300),
        preventOverlap: true,
      })
      
      
      
      
      this.normalNodes = []
      this.bboxes = []
      this.dombboxes = []
      this.loopEdges = []
      this.normalEdges = []
      this.graph.render();

    },

    getCls(e){
      let polarity = this.polarities.find(p => p.id == e.getContainer().cfg.id).polarity
      let cls = `${this.getBearing(e.getModel().startPoint, e.getModel().endPoint)}_arrow_${polarity}`
      return cls
    },

    pushEdgeBBoxes(){
      let edges = this.graph.getEdges()

      
      
      edges.forEach((e) => {
        var nedges = this.normalEdges.filter(c => c.id == e.getContainer().cfg.id)
        var ledges = this.loopEdges.filter(c => c.id == e.getContainer().cfg.id)
        
        let polarity = this.polarities.find(p => p.id == e.getContainer().cfg.id).polarity
        let cls = `${this.getBearing(e.getModel().startPoint, e.getModel().endPoint)}_arrow_${polarity}`
      
        
        if (nedges.length){
          
          if (e.getKeyShape().cfg.totalLength > 100) {
            this.renderEdges.push({
              e: nedges[0],
              cls: cls,
              id: nedges[0].id,
            })

          }
        }
        
        if (ledges.length){
          if (e.getKeyShape().cfg.totalLength > 100) {
            this.renderEdges.push({
              e: ledges[0],
              cls: cls,
              id: nedges[0].id,
            })

          }
        }

        if ((nedges.length || ledges.length) && e.getKeyShape().cfg.totalLength){
          
        }
      })
    },


    pushNodeBBoxes(){
      
      let nodes = this.graph.getNodes()
      
      for (let n of nodes){
        var nnode = this.normalNodes.filter(c => c.id == n.getContainer().cfg.id)       
        let b = n.getBBox()


        this.renderNodes.push({
          n: nnode,
          cls: 'variable',
          id: n.getContainer().id
        })

      }
      
    },

    sample(arr, probabilities){
      if (!probabilities || probabilities?.length != arr.length) {
        return arr[Math.floor(Math.random() * arr.length)]
      } else{
        let total = probabilities.reduce((a,b) => a+b)
        let rand = Math.random() * total
        let sum = 0
        for (let i = 0; i < arr.length; i++){
          sum += probabilities[i]
          if (rand < sum) return arr[i]
        }

      }
    },

    resizeHandler() {
      this.windowHeight = window.innerHeight;
      this.windowWidth = window.innerWidth;
      if (!this.graph || this.graph.get('destroyed')) return;
      if (!this.$refs.canvas || !this.$refs.canvas.scrollWidth || !this.$refs.canvas.scrollHeight) return;
      console.log('changeing size', this.$refs.canvas.scrollHeight)
      this.graph.changeSize(this.windowWidth, this.windowHeight)
    },

    causalLoopStyle() {
      var self = this
      
      let fill = Math.random() > 0.1 ? 'rgba(255,255,255,0)' : randomColor({ luminosity: 'light' })
      let textFill = fill == 'white' ? randomColor({ luminosity: 'dark' }) : readableColor(fill)
      let edgeStroke = Math.random() > 0.7 ? this.sample(['blue', 'black']) : this.sample(['black', randomColor({ luminosity: 'dark' })]) 
      let nodeStroke = fill !== 'rgba(255,255,255,0)' ? 'transparent' : randomColor({ hue: self.sample(['monochrome', 'blue']) })
      let nodeWidth = self.getRandom(100, 150)
      let nodeHeight = self.getRandom(15, 75)

      return {
        defaultNode: {
          ...this.sample([
            { type: 'ellipse-padded', size: [150, 75]},
            { type: 'ellipse-rect', size: [120, 45]},          
            // { type: 'rect', size: [120, 45]},          
            // { type: 'rect', size: [120, 45]},          
          ], [.5,0]),
          
          //'rect', 'circle'
          
          labelCfg: {
            position: 'center',
            fontSize: self.sample([12, 16]),
            style: {
              fontSize: this.getRandom(12, 16),
              fill: textFill,
              fontFamily: this.sample(['Arial', 'Courier', 'Times New Roman','Consolas']),
              background: {
                padding: [20, 20, 20, 20],
              },
            },
          },
          style: {
            fill: fill,
            // fillOpacity: this.sample([true, false]) ? 0 : 1,
            strokeOpacity: this.sample([true,false])?0:1,
            stroke: nodeStroke,
            lineWidth: Math.random() > 0.9 ? 1 : self.sample([0.5,0.2,2]),
          },
        },
        defaultEdge: {
          // type: this.sample(['line', 'quadratic', 'mid-point-edge', 'polarityEdge']),
          // type: this.sample(['polarityEdge']),
          type: 'loopEdge',
          // curveOffset: this.sample([this.getRandom(-80, 80), 0], [0.8,0.2]),
          // curvePosition: 0.5,
          // controlPoints: [{ x: '+10', y: '-20' }],
          hidden: false,
          style: {
            stroke: edgeStroke,
            lineWidth: this.sample([1,2,3]),
            startArrow: Math.random() >0.9 ? {
              fillOpacity: Math.random() > 0.9 ? 0.5 : 1,
              fill: edgeStroke,
              path: this.sample([
                G6.Arrow.circle(this.getRandom(2, 6), 0)
              ])
            } : false,
            // lineJoin: 'round',
            // lineCap: 'round',
          },
          labelCfg: {
            autoRotate: true,
            ...this.sample([{ refX: self.sample([10, 100]), refY: self.sample([-10, 0, 10]) }]),
            text: self.sample(['-', '+']),
            style: {
              background: {
                fill: '#ffffff',
                fillOpacity: 0,
                stroke: randomColor(),
                // padding: [2, 2, 2, 2],
                radius: 21,
              },

            },
          },
        },
        defaultCombo: {
          // ... Other properties for combos
          style: {
            fill: '#steelblue',
            stroke: '#eaff8f',
            lineWidth: 5,
            // ... Other style properties
          },
        },

      }
    },
  }
}

</script>


<style scoped>
.wrapper{
  /* height: 640px !important;
  height: 640px !important;
  max-height: 640px !important;
  max-height: 640px !important; */

  image-rendering: pixelated;
}

.dom-node {
  position: absolute;
  z-index: 100;
  border: 1px solid red;
  pointer-events: none !important;
}

.main{
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw;
  height: 100vh;
}
.buttons-wrapper{
  z-index: 4;
  position: absolute;
  left: 10px;
  top: 10px;
}
</style>
