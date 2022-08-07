import React, { Component } from 'react'; // let's also import Component

type ClockProps = {
  greeting: string,
  myTime: Date,
  cb?: () => void,
}
export class MyComp extends Component<ClockProps> {

  render() {
    return <p>The prop is {this.props.greeting}</p>
  }
}