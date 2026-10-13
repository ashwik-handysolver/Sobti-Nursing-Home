import React from 'react';
import { card } from './styles';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section';
}

export const Card: React.FC<CardProps> = ({ as: Tag = 'div', className = '', ...props }) => (
  <Tag {...props} className={`${card} ${className}`} />
);
