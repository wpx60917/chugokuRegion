import { AfterViewInit, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import * as d3 from 'd3';
import { CENTER_POINT, GEOJSON_FILE, MERCATOR_SCALE } from './map-settings';

@Component({
  selector: 'app-area-map',
  imports: [],
  templateUrl: './area-map.component.html',
  styleUrl: './area-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaMapComponent implements AfterViewInit{
  view = [500,540];
  protected _svg: d3.Selection<any, any, any, any>;
  protected _g: d3.Selection<any, any, any, any>;
  protected _zoom: d3.ZoomBehavior<any, any>;
  protected _path: d3.GeoPath;
  protected _width: number;
  protected _height: number;

  private _activeArea: d3.Selection<any, any, any, any>;
  private _isMobileDevice!: boolean;

  constructor(){
  }

  ngAfterViewInit(): void {
    this._zoom = d3.zoom().scaleExtent([1,7]).on('zoom',this.handleZoomEvent.bind(this));
    this._activeArea = d3.select(null);

    this._isMobileDevice = /iPad|iPhone|Android/.test(navigator.userAgent);

    if (this._svg !== undefined) {
      this.resetMapView();
      this._svg.selectAll('*').remove();
    }

    this._width = this.view[0];
    this._height = this.view[1];

    this.initMap();
    this.updateGeoJson();
  }

  private initMap(){
    this._svg = d3.select('svg').attr('viewBox',`50 35 ${this._width} ${this._height}`).on('click',this.resetMapView.bind(this));
    this._g = this._svg.append('g');
    this._svg.call(this._zoom);
  }

  private updateGeoJson(){
    d3.json(`assets/${GEOJSON_FILE}`).then((data)=>{
      this.drawMap(data);
    })
  }

  private drawMap(geoJsonData: any){
    const mercator = d3.geoMercator().center(CENTER_POINT).scale(MERCATOR_SCALE);
    this._path = d3.geoPath().projection(mercator);

    const groupData = d3.group(geoJsonData.features,(d:any)=>d.geometry.type);
    const controllableAreas = groupData.get('Polygon')?.filter((geo)=> geo.properties.control);
    const uncontrollableAreas = groupData.get('Polygon')?.filter((geo)=> !geo.properties.control);

    this.drawControllableArea(controllableAreas);
    this.drawUncontrollableArea(uncontrollableAreas);
    // this.drawLine(groupData.get('LineString'));
  }

  private drawControllableArea(polygonData: any[]){

    this._g.selectAll('path').data(polygonData).join('path')
    .attr('d',this._path)
    .attr('class','block blockHover')
    .attr('id',(d)=>`geo${d.properties.cartodb_id}`)
    .each((data:any)=>{
      const [x,y] = this._path.centroid(data);
      const xTranslate = x + parseInt(data.properties.textXtranslate??0) /2;
      const yTranslate = y + parseInt(data.properties.textYtranslate??0) +5/2;
      const nameBlock = this._svg.select('g').append('text').attr('pointer-events','none');
      const scale = data.properties.textScale??3;

      nameBlock.append('tspan')
      .attr('x',xTranslate)
      .attr('y',yTranslate)
      .attr('font-size',scale)
      .attr('text-anchor',data.properties.textAnchor??"middle")
      .text(data.properties.name);
    })
    .on('click',this.clickArea.bind(this));
  }

  private drawUncontrollableArea(polygonData: any[]){
    const polygonGroup = this._svg.append('g');

    const paths = polygonGroup.selectAll('path')
    .data(polygonData)
    .join('path')
    .attr('d', this._path);

    //combine all path string into one
    const polygonCombination = paths.nodes()
    .map(path => d3.select(path).attr('d'))
    .join(' ');

    polygonGroup.remove();

    this._g.append('path')
    .attr('d', polygonCombination)
    .attr('class', 'no-pointer-events uncontrollable');

  }

  // private drawLine(lineData: any[]){
  //   const lineGroup = this._svg.append('g');
  //   let lineCombination = '';
  //   lineGroup.selectAll('path').data(lineData).enter().append('path').attr('d',this._path).each((_:any,index:number,element:any)=>{
  //     lineCombination += d3.select(element[index]).attr('d');
  //   });
  //   lineGroup.remove();

  //   this._g.append('path').attr('d',lineCombination).attr('class','line').lower();
  // }

  private resetMapView(){
    this._svg.transition().duration(1000).call(this._zoom.transform,d3.zoomIdentity.translate(0,0).scale(1));
    this._svg.classed('active',false);
    this._activeArea.classed('active',false);
    this._activeArea = d3.select(null);//TODO check
    // this._activeArea = null;
  }

  private handleZoomEvent(event: any):void{
    this._g.attr('transform',event.transform);
  }

  private clickArea(area:any,data:any){
    area.preventDefault();
    if (this._activeArea?.node() === area.target) {
      this.resetMapView();
      return;
    }

    this._activeArea?.classed('active',false);
    this._activeArea = d3.select(area.target).classed('active',true);

    this._svg.classed('active',true);

    //TODO send click area event

    const bounds = this._path.bounds(data);
    console.log(bounds);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1]+5;
    // const x = (bounds[0][0] + bounds[1][0]-20)/2-25;
    // const y = (bounds[0][1] + bounds[1][1])/2 -20;
    const [x,y] = this._path.centroid(data);
    const scale = Math.max(1,Math.min(6,0.9/Math.max(dx/this._width,dy/this._height)));
    const translate = [this._width /2 -scale*x, this._height/2-scale*y];//from view center to area center

    area.stopPropagation();

    this._svg.transition().duration(750).call(this._zoom.transform,d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale));
  }

}
