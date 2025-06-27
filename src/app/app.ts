import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThreeJS } from "./three-js/three-js";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThreeJS],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'poc-threejs';
}
