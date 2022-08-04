import React, { FunctionComponent } from 'react'; // importing FunctionComponent

type CardParagraph = {
  content: string
}

type CardProps = {
  title: string,
  paragraph: CardParagraph
}

export const Card: FunctionComponent<CardProps> = ({ title, paragraph }) => <aside>
  <h2>{ title }</h2>
  <p>
    { paragraph.content }
  </p>
</aside>

const el = <Card title="Welcome!" paragraph={{content:"To this example"}} />