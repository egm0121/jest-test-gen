import * as React from 'react';

type CardProps = {
  title: string,
  paragraph: string
}

export const Card: React.FC<CardProps> = ({ title, paragraph }) => <aside>
  <h2>{ title }</h2>
  <p>
    { paragraph }
  </p>
</aside>

const el = <Card title="Welcome!" paragraph="To this example" />