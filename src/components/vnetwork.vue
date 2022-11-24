<template>
    <button @click="getRandomGraph">refresh</button>
    <v-network-graph v-if="currentGraph" class="graph" :nodes="currentGraph.nodes" :edges="currentGraph.edges" @load="loaded" :configs="getConfig()" >
        <!-- To use CSS within SVG, use <defs>. -->
        <defs>
            <!-- Cannot use <style> directly due to restrictions of Vue. -->
            <component is="style">
                <!-- prettier-ignore -->
                .marker {
                fill: transparent;
                stroke: {{ getConfig().edge.normal.color }};
                transition: fill 0.1s linear;
                pointer-events: none;
                }
                }
            </component>
        </defs>
        <template #edge-overlay="{ scale, center, position, hovered, selected }">
            <!-- Place the triangle at the center of the edge -->
            <path v-if="Math.random()>0.8" class="marker" :class="{ hovered, selected }" d="M-8 -8 L-8 10 L-5 Z" :transform="makeTransform(center, position, scale)" />
        </template>
        <template #override-node-label="{
          nodeId, scale, text, x, y, config, textAnchor, dominantBaseline
        }">
            <text v-for="t, i in wrapText(text).split('|')" x="0" :y="(i * (scale * 10)) - ((1 * (scale*10))/2)" :font-size="9 * scale" text-anchor="middle" dominant-baseline="central" fill="#000" v-text="t
            "></text>
            <text></text>
            
        </template>
    </v-network-graph>
</template>
<script>
import generate from '@/mixins/generateGraphs.js';
import * as vNG from "v-network-graph";
import {ForceLayout } from "v-network-graph/lib/force-layout"
import wrap from 'word-wrap';


export default {
        mixins: [generate],
        components: {
            
        },
        data() {
            return {
                nodeCount: 40,
                graphs: null,
                currentGraph: null,
            }
        },
        mounted() {
            
            this.graphs = this.generateRandomGraphs(10)                
            this.getRandomGraph()
        },
        methods: {
            loaded(e){
                console.log(e)
            },  
            getConfig(){
                return vNG.defineConfigs({
                    node: {
                        normal: {
                            type: "rect",
                            width: 75,
                            height: 20,
                            color: "white",
                        },
                        label: {
                            fontSize: 12,
                            visible: true,
                            color: 'black',
                            text: 'label'
                        }
                    },
                    edge: {
                        selectable: false,
                        normal: {
                            width: 2,
                            color: "#4466cc",
                        },
                        marker: {
                            target: {
                                type: "arrow",
                                width: 5,
                                height: 3,
                                margin: 0,
                                units: "strokeWidth",
                                color: null,
                            },
                        },
                        gap: 60,
                        type: "curve",
                        margin: 0,

                    },
                    path: {
                        visible: true,
                        end: "edgeOfNode",
                        normal: {
                            width: 10,
                            color: "#ff800088",
                        },
                    },

                    view: {
                        // autoPanAndZoomOnLoad: 'fit-content',
                        layoutHandler: new ForceLayout({
                            // positionFixedByDrag: false,
                            scalingObjects: false,
                            // autoPanOnResize: true,
                            // panEnabled: true,
                            // zoomEnabled: true,
                            // positionFixedByClickWithAltKey: true,
                            // * The following are the default parameters for the simulation.
                            // * You can customize it by uncommenting below.
                            createSimulation: (d3, nodes, edges) => {
                                const forceLink = d3.forceLink(edges).id(d => d.id)
                                return d3
                                    .forceSimulation(nodes)
                                    .force("edge", forceLink.distance(300))
                                    .force("charge", d3.forceManyBody())
                                    .force("collide", d3.forceCollide(50).strength(0.2))
                                    .force("center", d3.forceCenter().strength(0.05))
                                    .alphaDecay(0.4)

                            }
                        }),
                    },

                })
            },
            wrapText(text){
                return wrap(text, { width: 30, newline: '|' })
            },
            makeTransform(center, edgePos, scale) {
                const radian = Math.atan2(
                    edgePos.target.y - edgePos.source.y,
                    edgePos.target.x - edgePos.source.x
                )
                const degree = (radian * 180.0) / Math.PI

                return [
                    `translate(${center.x} ${center.y})`,
                    `scale(${scale}, ${scale})`,
                    `rotate(${degree})`,
                ].join(" ")
            },
            getRandomGraph() {
                // cycle through this.graphs
                // console.log(this.graphs)
                let g = this.styleGraph(this.graphs[Math.floor(Math.random() * this.graphs.length)]);
                this.currentGraph = g;
            },
            
            styleGraph(g) {
                return {
                    nodes: g.nodes.map(n => {
                        // replace every third space in string with newline
                        let t = n.label
                        return {
                            id: n.key,
                            label: `${this.randomWords(2)}\n${this.randomWords(2)}`,
                        }
                    }),
                    edges:  g.edges.map(e => {
                        return {
                            source: e.source,
                            target: e.target,
                            annotation: Math.random() > 0.5 ? true : false,
                        }
                    })
                }
            }
        },

}
</script>
<style lang="css">

.graph {
  width: 800px;
  height: 600px;
  
}
</style>