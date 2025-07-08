import React from 'react';
import { Button } from './button';

export const GradientTest: React.FC = () => {
  const testGradients = [
    'linear-gradient(to right, #FF6B6B, #4ECDC4)',
    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
    'radial-gradient(circle at center, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
  ];

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Gradient Test</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gradient Previews:</h3>
        <div className="grid grid-cols-2 gap-4">
          {testGradients.map((gradient, index) => (
            <div key={index} className="space-y-2">
              <div 
                className="w-20 h-20 rounded-lg border"
                style={{ background: gradient }}
              />
              <p className="text-xs text-gray-600 break-all">{gradient}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Buttons with Gradients:</h3>
        <div className="space-y-4">
          {testGradients.map((gradient, index) => (
            <div key={index} className="space-y-2">
              <Button 
                className="w-full"
                style={{ 
                  background: gradient,
                  color: 'white',
                  border: 'none'
                }}
              >
                Button with {gradient.includes('linear') ? 'Linear' : 'Radial'} Gradient {index + 1}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comparison: Solid vs Gradient</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="w-full"
            style={{ 
              backgroundColor: '#FF6B6B',
              color: 'white',
              border: 'none'
            }}
          >
            Solid Color Button
          </Button>
          <Button 
            className="w-full"
            style={{ 
              background: 'linear-gradient(to right, #FF6B6B, #4ECDC4)',
              color: 'white',
              border: 'none'
            }}
          >
            Gradient Button
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">CSS Output Test:</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm font-mono">
            {testGradients[0]}
          </p>
        </div>
      </div>
    </div>
  );
}; 