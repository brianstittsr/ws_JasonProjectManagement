import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';

interface ApiConfigCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  onClick: () => void;
}

const ApiConfigCard: React.FC<ApiConfigCardProps> = ({
  title,
  description,
  icon,
  isConnected,
  onClick,
}) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              {icon}
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          <div className={`flex items-center ${isConnected ? 'text-green-500' : 'text-gray-400'}`}>
            <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs font-medium">
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {/* Additional content can go here */}
      </CardContent>
      <CardFooter>
        <Button onClick={onClick} variant="outline" className="w-full">
          {isConnected ? 'Manage Configuration' : 'Connect'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiConfigCard;
