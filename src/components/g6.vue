<template>
  <main class="main"  @keydown.enterz="onPressSpace">
    <p v-if="currentGraph?.type">{{ currentGraph.type }}</p>
    <div ref="canvas" class="wrapper" :style="{filter: `blur(${Math.random() > 0.8 ? sample([0.2, 0.3,0.4, 0.5,0.6]) : 0}px)`}"></div>
    
    <!-- <button style="z-index:4; position: absolute;left:10px;top:10px;" @click="getRandomGraph">refresh</button> -->
    <button ref="saveButton" style="z-index:4; position: absolute;left:10px;top:10px;" @click="saveNGraphs">refresh & save</button>
  </main>
</template>

<script>
import G6 from '@antv/g6';

import randomColor from 'randomcolor';
import generate from '@/mixins/generateGraphs.js';
import { readableColor, darken, toHex, lighten, saturate, desaturate, } from 'color2k';
import { ext } from '@antv/matrix-util';
import { faker } from '@faker-js/faker';
const r = v => Math.random() > v ? true : false
import wrap from 'word-wrap';


export default {
  mixins: [generate],
  data() {  
    return {
      counter: 0,
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
  },
  destroyed() {
    window.removeEventListener("resize", this.resizeHandler);
    window.removeEventListener("keydown", this.onKeydown);
  },
  mounted() {
    document.addEventListener("keydown", this.onKeydown);
    var self=this;
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;

    // // disable msImageSmoothingEnabled for canvas ref
    // this.$refs.canvas.msImageSmoothingEnabled = false;
    // this.$refs.canvas.mozImageSmoothingEnabled = false;
    // this.$refs.canvas.webkitImageSmoothingEnabled = false;
    // this.$refs.canvas.imageSmoothingEnabled = false;
    // console.log(this.$refs.canvas);
    
    // const ctx = this.$refs.canvas.getContext('2d')
    // ctx.msImageSmoothingEnabled = false;
    // ctx.mozImageSmoothingEnabled = false;
    // ctx.webkitImageSmoothingEnabled = false;
    // ctx.imageSmoothingEnabled = false;
    
    const transform = ext.transform;

    this.$refs.saveButton.click()
    // for (let i = 0; i < 10; i++) {
      
    //     setTimeout(() => {
    //       this.$refs.saveButton.click()
    //     }, 1000)
            
    // }
    

    G6.registerNode( // ellipse-rect
      'ellipse-rect',
      {
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1];
          const scale = 0.8
          
          
          
          group.get('children')[0].attr({
            stroke: 'transparent',
            rx: width*0.8,
            ry: height*0.8,
          });

          
          
          const labelBBox = group.get('children')[0].getBBox();

          const keyShape = group.addShape('rect', {
            attrs: {
              ...cfg.style,
              // stroke: 'transparent',
              fill: 'transparent',
              x: -(labelBBox.width * scale)/2,
              y: -(labelBBox.height * scale)/2,
              width: labelBBox.width*scale,
              height: labelBBox.height*scale
              
            },
            draggable: true,
          });



        },
      },

      'ellipse',
    );

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
              // fill: 'transparent',
              ry: height*0.4,
              rx: width*0.4,
            },
            draggable: true,
          });
          
          
          keyShape.toBack()

        },
        update: undefined
      },
      // Extend the 'single-node'
      'ellipse',
    );

   

    G6.registerEdge( // loopEdge
      'loopEdge', {
      options: {
        style: {
          stroke: '#000',
        },
      },
      labelAutoRotate: true,
      afterDraw(cfg, group) {
        const shape = group.get('children')[0];
        // change shape
        const endPoint = shape.getPoint(0.9);
        const midPoint = shape.getPoint(0.5);
        const startPoint = shape.getPoint(0.1);
        const length = shape.cfg.totalLength
        let radian = Math.atan((startPoint.y - endPoint.y) / ((startPoint.x - endPoint.x)));
        if (length<100){
          shape.attr({
            stroke: 'transparent',
            style: {
              endArrow: false,
              startArrow: false
            }
          });
        } else {
          shape.attr({
            
              endArrow: self.sample([true, {
                fillOpacity: Math.random() > 0.9 ? 0.5 : 1,
                fill: cfg.style.stroke,
                path: self.sample([
                  G6.Arrow.triangle(self.getRandom(5, 8), self.getRandom(10, 20), 0),
                  G6.Arrow.vee(self.getRandom(5, 15), self.getRandom(2, 20), 0),
                  // G6.Arrow.circle(this.getRandom(2, 6), 0)
                ])
              }]),
            
          });   
          
          const polarity = group.addShape('text', {
            attrs: {
              text: self.sample(['+', '–', 'S', 'P', 'O']),
              fill: cfg.style.stroke,
              textAlign: 'start',
              textBaseline: 'middle',
              fontVariant: 'bold',
              fontSize: cfg.style.fontSize,
              x: endPoint.x,
              y: endPoint.y,
            },
            name: 'polarity-text-shape',
          });
          let matrix = polarity.getMatrix();
          if (!matrix) matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

          const polarityMatrix = transform(matrix, [
            ['t', 10, 10], // translate
            ['s', 1, 1],
          ]);
          polarity.setMatrix(polarityMatrix);

          if (Math.random() > 0.9) {

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
          
        }
        
        if ( length > 300 && self.totalLoopSymbols < 7) {
          self.totalLoopSymbols+=1
          
          
          // shape.attr({
          //   stroke: 'transparent',
          //   endArrow: false,
          // });
          
          // const stroke = (cfg.style && cfg.style.stroke) || this.options.style.stroke;
          
          let size = 60
        
          // the init matrix for a shape or a group is null, initiate it with unit matrix


          

          const loop = group.addShape('image', {
            attrs: {
              img: `arrows/${self.getRandom(0,72)}.png`,
              x: midPoint.x-size/2,
              y: midPoint.y-size/2,
              width: size,
              height: size,
            },
            name: 'loop-image',
          });


          let loopText = self.sample([self.sample(['–', '—', '-']), '+', self.sample(['R', 'B']) + self.sample([self.getRandom(1, 20)])])
          // check if loopText starts with R or B
          let loopTextSize = loopText.startsWith('R') || loopText.startsWith('B') ? 18 : 30
          let loopFontWeight = loopText.startsWith('R') || loopText.startsWith('B') ? 400 : 200
            
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

          let matrix = loop.getMatrix();
          if (!matrix) matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

          const symbolMatrix = transform(matrix, [
            ['t', -100,-50], // translate
            ['s',1,1],
          ]);
          
          
          // const loopMatrix = transform(matrix, [
          //   ['t', -100,-50], // translate
          //   ['s', 1, 1],
          //   ['r', 10, 1],
          // ]);

          symbol.setMatrix(symbolMatrix);
          loop.setMatrix(symbolMatrix);
          // loop.setMatrix(loopMatrix);
          

        }
        
        

        return shape;
      },
      update: undefined
      
      
    }, Math.random()>0.1?'quadratic':'line'
    )

    this.graphs = this.generateRandomGraphs(6)
    this.graphs = this.graphs.map(g=>
      this.styleGraph(g)
    )
    // this.drawGraph(g, this.causalLoopStyle())
    // this.getRandomGraph()
    // this.getRandomGraph()
    
    // this.getRandomGraph()
    
    
    // this.graphs = [this.getSocialGraph('deezer')]
    // this.styleGraph(this.graphs[0])
    
        
    

    

  },
  computed: {

  },
  methods: {

    onKeydown(event) {
      if (event.code === "Space") {
        this.$refs.saveButton.click()
        
      }
    },

    onPressSpace(){
      console.log('space')
    },  

    saveNGraphs(){
      this.counter +=1
      this.saveNextGraph(this.counter)
      
    }, 

    saveNextGraph(i){
      // loop graphs
      let g = this.generateRandomGraphs(1)
      let p = this.styleGraph(g[0])
      this.drawGraph(p, this.causalLoopStyle(), i)      
      
    },
    
    

    getRandomColor() {
      return randomColor({ luminosity: 'dark' })
    },

    getRandomGraph() {
      // cycle through this.graphs
      // console.log(this.graphs)
      let g = this.graphs[Math.floor(Math.random() * this.graphs.length)];
      this.drawGraph(g, this.causalLoopStyle(), 'test')
      this.currentGraph = g;
      
      
      // let values = 
      // this.graph.zoomTo( 0.7);
      

    },

    styleGraph(g) {
      var self = this;
      var cls = self.causalLoopStyle()
      
      var g = {
        nodes: g.nodes.map(n => {
          return {
            ...n,
            id: n.key,
            label: Math.random() > 0.8 ? `${this.randomWords(2)}\n${this.randomWords(2)}`.toUpperCase() : `${this.randomWords(2)}\n${this.randomWords(2)}`,
            comboId: this.sample(['a', 'b'])
          }
        }),
        combos: [
          { // define comboA
            id: 'a',
            label: 'A',
            parentId: 'a',
            size: 100,
            type: 'circle'
          },
          { // define comboB
            id: 'b',
            label: 'A',
            parentId: 'b',
            size: 100,
            type: 'circle'
          }
        ],
        edges: g.edges.map(e => {
          return {
            ...e,
            comboId: this.sample(['a', 'b']),
            // label: ['',self.sample(['', '-'])],
            symbol: Math.random() > 0.95 ? true : false,
            style: {
              ...cls.defaultEdge.style,
              lineWidth: Math.random() > 0.9 ? 5 : this.getRandom(1, 2),
              stroke: Math.random() > 0.9 ? randomColor({ luminosity: 'bright' }) : cls.defaultEdge.style.stroke, 
              lineDash: Math.random() > 0.2 ? null : [5,5],

            },
            source: e.source,
            target: e.target,
          }
        })
      }

      // g = this.addvisualElements(g)
      
      return g
    },

    addvisualElements(g){
      // iterate a random number of times
      for (let i = 0; i < this.getRandom(1, 8); i++) {
        // let t = this.sample(['paragraph', 'random-image'])
        let t = this.sample(['paragraph'])
        g.nodes.push({
          id: `loop${Math.random()}`,
          type: t,
          textAlign: 'left',
          style: {
            textAlign: 'left'
          },
          label: t == 'paragraph' ? wrap(faker.lorem.paragraph(), { width: 30 }) : '',

          fx: 0,
          fy: 0,
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
          // nodeSize: 10,
          container: this.$refs.canvas,
          width: 640,
          height: 640,
          fitCenter: true,
          fitView: true,
          fitViewPadding: 20,

          gpuEnabled: true,
          preventOverlap: {padding: 20},
          // nodeSpacing: 50,
          modes: {
            default: ['drag-canvas'  , 'zoom-canvas', 'drag-node'],
          },
          ...style
        })

        this.graph.fitCenter(180)

      // }
      this.graph.data({
        nodes: g.nodes,
        edges: g.edges,
      });

      this.graph.updateLayout({
                
        
        ...this.sample([
          // {
          //   type: 'force',
          //   gravity: 5,
          //   edgeStrength: 1,
          //   nodeStrength: 1,
          //   linkDistance: this.getRandom(200,600)
          // },
          // {
          //   type: 'fruchterman',
          //   gravity: 5,
          //   speed: 2,
          //   clustering: true,
          //   clusterGravity: 30,
          //   maxIteration: 2000,
          // }  
          // {
          //   type: 'radial',
          //   center: [200, 200], // The center of the graph by default
          //   linkDistance: 200, // The edge length
          //   maxIteration: 1000,
          //   focusNode: 'node11',
          //   unitRadius: 100
          // },
          {
            type: 'forceAtlas2',
            fitView: true,
            // width: this.windowWidth*.3,
            // height: this.windowHeight*.3,
            // width: 300,
            // height: 300,
          }
        ]),
        linkDistance: this.getRandom(100,300),
        preventOverlap: true,
        // nodeSize: 60,
        // nodeSpacing: 2,
        // width: this.windowWidth,
        // height: this.windowHeight,
      })
      
      // iterate over all node items in graph
  
      // this.graph.on('node:dragstart', function (e) {
      //   const forceLayout = self.graph.get('layoutController').layoutMethods[0];
      //   forceLayout.stop()
      // });

      // this.graph.on('node:drag', function (e) {
      //   self.refreshDragedNodePosition(e);
      //   self.graph.layout()
      // });

      this.graph.render();
      // this.graph.downloadImage(`graph_${name}`, 'image/jpeg', 'white')
      
      
      
    },

    sample(arr){
      return arr[Math.floor(Math.random() * arr.length)]
    },

    resizeHandler() {
      this.windowHeight = window.innerHeight;
      this.windowWidth = window.innerWidth;
      if (!this.graph || this.graph.get('destroyed')) return;
      if (!this.$refs.canvas || !this.$refs.canvas.scrollWidth || !this.$refs.canvas.scrollHeight) return;
      console.log('changeing size', this.$refs.canvas.scrollHeight)
      this.graph.changeSize(this.windowWidth, this.windowHeight)
    },

    refreshDragedNodePosition(e) {
      const model = e.item.get('model');
      model.fx = e.x;
      model.fy = e.y;
      model.x = e.x;
      model.y = e.y;
    },

    causalLoopStyle() {
      var self = this
      
      let fill = Math.random() > 0.1 ? 'rgba(255,255,255,0)' : randomColor({ luminosity: 'dark' })
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
            
            
            
          ]),
          
          //'rect', 'circle'
          
          labelCfg: {
            position: 'center',
            fontSize: self.sample([12, 16]),
            style: {
              fontSize: self.sample([12, 16]),
              fill: textFill,
              fontFamily: this.sample(['Arial', 'serif']),
              background: {
                // padding: [20, 20, 20, 20],
              },
            },
          },
          style: {
            fill: fill,
            // fillOpacity: this.sample([true, false]) ? 0 : 1,
            strokeOpacity: this.sample([true,false])?0:1,
            stroke: nodeStroke,
            lineWidth: Math.random() > 0.9 ? 1 : 3,
          },
        },
        defaultEdge: {
          // type: this.sample(['line', 'quadratic', 'mid-point-edge', 'polarityEdge']),
          // type: this.sample(['polarityEdge']),
          type: 'loopEdge',
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
header {
  line-height: 1.5;
}

.wrapper{
  border: 1px solid black;
  max-width: 1024px;
  max-height: 1024px;
}

.main{
  display: flex;
    align-items: flex-start;
    justify-content: flex-start;
  margin: 0 auto;
  padding: 0;
}

/* import a font */

@import url('https://www.dafontfree.net/embed/b3B0aXJpcHBsZS1ib2xkJmRhdGEvNTg4L28vMTc5OTY2L09QVElSaXBwbGUtQm9sZC5vdGY');


.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
