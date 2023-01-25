<template>
  
    <!-- <button v-if="library!=='visjs'" @click="library='visjs'">Try visjs</button>&nbsp;
    <button v-if="library!=='vnetwork'" @click="library='vnetwork'">Try v-network</button>
    <button v-if="library !== 'g6'" @click="library='g6'">Try g6</button> -->
    
    
    <g6 v-if="library=='g6'"/>
    <!-- <visjs v-if="library=='visjs'"/>
    <vnetwork v-if="library =='vnetwork'"/> -->


  
</template>

<script>
import g6 from '@/components/g6.vue';
import visjs from '@/components/visjs.vue';

import vnetwork from '@/components/vnetwork.vue';


export default {
  components: {
    g6,
    visjs,
    
    vnetwork
  },
  data() {
    return {
      library: 'g6'
    }
  },
}


</script>


<style>
html, body, #app{
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}
</style>
