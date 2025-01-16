import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mental-test',
  imports: [],
  templateUrl: './mental-test.component.html',
  styleUrl: './mental-test.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentalTestComponent { }
