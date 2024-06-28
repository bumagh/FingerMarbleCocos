import { Color, Component, Label, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FingerMarbleScoreLabel')
export class FingerMarbleScoreLabel extends Component
{
   public scoreLabel: Label;
   protected onLoad(): void
   {
      this.scoreLabel = this.node.getComponent<Label>(Label);
   }
   private score: number = 0;
   private blueColor = new Color("#47F71E")
   private redColor = Color.RED;
   public InitScore()
   {
      this.SetScore(0);
   }

   public AddScore(score: number)
   {
      this.score = this.score + score;
      this.SetScore(this.score);
   }
   public SetScore(score: number)
   {
      this.score = score;
      this.scoreLabel.string = (score >= 0 ? "+" : "") + score;
      this.scoreLabel.color = score >= 0 ? this.blueColor : this.redColor;
   }
   public getScore()
   {
      return this.score;
   }

   public getScoreStr()
   {
      return this.scoreLabel.string;
   }
}