import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AreaMapComponent } from "./area-map/area-map.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AreaMapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'chugokuRegion';
}
