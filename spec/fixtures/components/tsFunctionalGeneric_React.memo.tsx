import * as React from 'react';

type CardProps = {
  title: string,
  paragraph: string
}

const Card: React.FC<CardProps> = ({ title, paragraph }) => <aside>
  <h2>{ title }</h2>
  <p>
    { paragraph }
  </p>
</aside>

export default React.memo(Card);