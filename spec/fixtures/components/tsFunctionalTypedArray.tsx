import React from 'react'; // we need this to make JSX compile

type CardProps = {
  title: string,
  items: string[] 
}

export const CardItems = ({ title, items }: CardProps) => <aside>
  <h2>{ title }</h2>
  <p>
    { items.join(',') }
  </p>
</aside>

const el = <CardItems title="Welcome!" items={['a','b','c']} />