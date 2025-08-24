# Enhanced Food Recognition Feature

## Overview

The Enhanced Food Recognition feature provides premium AI-powered food analysis capabilities for both web and mobile applications. This feature significantly improves upon the existing food recognition system by adding multi-item recognition, portion size estimation, and advanced nutritional analysis.

## Features

### 1. Multi-Item Recognition
- **Simultaneous Recognition**: Detect and analyze multiple food items in a single photo
- **Object Detection**: Advanced computer vision to separate and identify individual food items
- **Confidence Scoring**: Each detected item receives a confidence score for accuracy

### 2. Portion Size Estimation
- **AI-Powered Calculation**: Estimate portion sizes using reference objects
- **Reference Object Support**: Common objects like hands, credit cards, smartphones
- **3D Estimation**: Optional 3D depth estimation for more accurate sizing
- **Custom Reference Objects**: Support for custom reference objects

### 3. Enhanced Nutritional Database
- **500K+ Food Items**: Expanded database with comprehensive nutritional information
- **Barcode Scanning**: Integration with barcode scanning for packaged foods
- **Real-time Updates**: Continuous database expansion and updates

### 4. Restaurant Menu Recognition
- **Specialized AI**: Optimized for restaurant menu items and dishes
- **Menu Context**: Understanding of restaurant-specific food presentations
- **Portion Standardization**: Standard portion sizes for restaurant dishes

## Technical Architecture

### Server Components

#### Enhanced Food Recognition Service (`server/src/services/enhancedFoodRecognitionService.ts`)
- Main service orchestrating all food recognition operations
- Integrates with AI service for food identification
- Combines with portion size estimation for comprehensive analysis
- Handles both single and multi-food recognition

#### Portion Size Service (`server/src/services/portionSizeService.ts`)
- Specialized service for portion size estimation
- Reference object management
- 3D depth estimation capabilities
- Custom reference object support

#### API Routes (`server/src/routes/user/enhanced-food-recognition.ts`)
- RESTful API endpoints for enhanced food recognition
- Support for single food analysis
- Multi-food analysis endpoints
- Restaurant menu recognition
- Portion size estimation endpoints

### Client Components

#### Mobile App (`mobile/src/screens/CameraScreen.tsx`)
- Enhanced camera interface with multi-food mode
- Real-time analysis feedback
- Portion size display
- Health score integration

#### Web App (`client/src/components/camera/camera-view.tsx`)
- Web-based camera interface
- Multi-food capture support
- Enhanced results display
- Integration with existing UI components

## API Endpoints

### Single Food Analysis
```http
POST /api/user/enhanced-food-recognition/analyze-single
```

**Request Body:**
```json
{
  "imageData": "data:image/jpeg;base64,...",
  "options": {
    "enablePortionEstimation": true,
    "enable3DEstimation": false,
    "confidenceThreshold": 0.7,
    "referenceObjects": ["hand", "credit_card", "smartphone"],
    "restaurantMode": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "food_123456789",
    "foodName": "Grilled Chicken Breast",
    "confidence": 0.95,
    "category": "protein",
    "nutritionalInfo": {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6,
      "fiber": 0,
      "sugar": 0,
      "sodium": 74,
      "micronutrients": {
        "vitamins": ["B6", "Niacin", "B12"],
        "minerals": ["Phosphorus", "Selenium"]
      }
    },
    "portionSize": {
      "estimatedWeight": 150,
      "confidence": 0.88,
      "referenceObject": "hand",
      "dimensions": { "width": 120, "height": 80 },
      "suggestedPortion": {
        "weight": 150,
        "description": "1 serving (150g)"
      }
    },
    "allergens": ["none"],
    "healthScore": 85,
    "densityScore": 92,
    "processingTime": 2345,
    "modelVersion": "enhanced-v1.0"
  }
}
```

### Multi-Food Analysis
```http
POST /api/user/enhanced-food-recognition/analyze-multi
```

**Request Body:**
```json
{
  "imageData": "data:image/jpeg;base64,...",
  "options": {
    "enablePortionEstimation": true,
    "confidenceThreshold": 0.7,
    "referenceObjects": ["hand", "credit_card"],
    "restaurantMode": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "id": "food_123456789",
        "foodName": "Brown Rice",
        "confidence": 0.92,
        "category": "carbs",
        "nutritionalInfo": {
          "calories": 216,
          "protein": 5,
          "carbs": 45,
          "fat": 1.8,
          "fiber": 3.5,
          "sugar": 0.4,
          "sodium": 10
        },
        "portionSize": {
          "estimatedWeight": 200,
          "confidence": 0.85,
          "referenceObject": "hand",
          "dimensions": { "width": 150, "height": 100 },
          "suggestedPortion": {
            "weight": 200,
            "description": "1 cup cooked"
          }
        },
        "healthScore": 78,
        "densityScore": 65
      },
      {
        "id": "food_987654321",
        "foodName": "Steamed Broccoli",
        "confidence": 0.89,
        "category": "vegetables",
        "nutritionalInfo": {
          "calories": 55,
          "protein": 3.7,
          "carbs": 11.2,
          "fat": 0.6,
          "fiber": 5.1,
          "sugar": 1.9,
          "sodium": 33
        },
        "portionSize": {
          "estimatedWeight": 150,
          "confidence": 0.82,
          "referenceObject": "hand",
          "dimensions": { "width": 120, "height": 90 },
          "suggestedPortion": {
            "weight": 150,
            "description": "1.5 cups"
          }
        },
        "healthScore": 95,
        "densityScore": 88
      }
    ],
    "analysisMetadata": {
      "processingTime": 4567,
      "modelVersion": "enhanced-v1.0",
      "confidenceThreshold": 0.7,
      "totalFoods": 2,
      "averageConfidence": 0.905
    }
  }
}
```

### Restaurant Menu Recognition
```http
POST /api/user/enhanced-food-recognition/analyze-restaurant-menu
```

**Request Body:**
```json
{
  "imageData": "data:image/jpeg;base64,...",
  "restaurantName": "The Italian Bistro",
  "options": {
    "enablePortionEstimation": true,
    "confidenceThreshold": 0.8,
    "referenceObjects": ["hand", "credit_card"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "id": "food_menu_001",
        "foodName": "Margherita Pizza",
        "confidence": 0.94,
        "category": "main_course",
        "nutritionalInfo": {
          "calories": 266,
          "protein": 11,
          "carbs": 33,
          "fat": 11,
          "fiber": 2,
          "sugar": 3,
          "sodium": 554
        },
        "portionSize": {
          "estimatedWeight": 256,
          "confidence": 0.91,
          "referenceObject": "plate",
          "dimensions": { "width": 200, "height": 200 },
          "suggestedPortion": {
            "weight": 256,
            "description": "1 slice"
          }
        },
        "healthScore": 65,
        "densityScore": 72
      }
    ],
    "analysisMetadata": {
      "processingTime": 5234,
      "modelVersion": "enhanced-v1.0",
      "confidenceThreshold": 0.8,
      "totalFoods": 1,
      "averageConfidence": 0.94
    },
    "restaurantInfo": {
      "name": "The Italian Bistro",
      "analysisType": "menu_recognition",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Portion Size Estimation
```http
POST /api/user/enhanced-food-recognition/portion-estimate
```

**Request Body:**
```json
{
  "foodName": "apple",
  "foodDimensions": {
    "width": 100,
    "height": 100
  },
  "imageDimensions": {
    "width": 1920,
    "height": 1080
  },
  "options": {
    "referenceObjects": ["hand", "credit_card"],
    "enable3DEstimation": false,
    "confidenceThreshold": 0.7
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimatedWeight": 182,
    "confidence": 0.89,
    "referenceObject": "hand",
    "dimensions": { "width": 100, "height": 100 },
    "suggestedPortion": {
      "weight": 182,
      "description": "1 medium apple"
    }
  }
}
```

## Configuration Options

### Enhanced Food Recognition Options
- `enablePortionEstimation`: Enable/disable portion size estimation (default: true)
- `enable3DEstimation`: Enable/disable 3D depth estimation (default: false)
- `confidenceThreshold`: Minimum confidence score for results (default: 0.7)
- `referenceObjects`: Array of reference objects for portion estimation
- `restaurantMode`: Enable restaurant-specific recognition (default: false)

### Reference Objects
- **hand**: Average human hand dimensions
- **credit_card**: Standard credit card (85.6mm × 53.98mm)
- **smartphone**: Average smartphone dimensions (147mm × 71mm)
- **coin**: US Quarter (24.26mm diameter)
- **business_card**: Standard business card (89mm × 51mm)

## Integration Guide

### Mobile App Integration

1. **Update Camera Screen**:
   - Import enhanced food recognition service
   - Update API calls to use new endpoints
   - Add portion size display to results

2. **Update Dependencies**:
   ```bash
   npm install @react-native-camera-roll/camera-roll
   npm install @react-native-async-storage/async-storage
   ```

3. **Update CameraScreen.tsx**:
   ```typescript
   import { API_URL } from '../config';
   import { safeFetchJson } from '../utils/fetchWrapper';

   // Update analyzeImageMutation to use enhanced API
   const analyzeImageMutation = useMutation({
     mutationFn: async (imageUri: string) => {
       // Convert image to base64
       const imageData = await convertImageToBase64(imageUri);
       
       const options = {
         enablePortionEstimation: true,
         confidenceThreshold: 0.7,
         referenceObjects: ['hand', 'credit_card']
       };
       
       const data = await safeFetchJson(`${API_URL}/api/user/enhanced-food-recognition/analyze-single`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ imageData, options })
       });
       
       return data;
     }
   });
   ```

### Web App Integration

1. **Update Camera Component**:
   - Import enhanced API configuration
   - Update image capture and analysis logic
   - Add enhanced results display

2. **Update Dependencies**:
   ```bash
   npm install react-webcam
   npm install @types/react-webcam
   ```

3. **Update CameraView.tsx**:
   ```typescript
   import { API_URL } from '../../lib/config';
   
   const handleFinalCapture = async () => {
     const imageData = await convertImageToBase64(capturedImage);
     
     const options = {
       enablePortionEstimation: true,
       confidenceThreshold: 0.7,
       referenceObjects: ['hand', 'credit_card']
     };
     
     const response = await fetch(`${API_URL}/api/user/enhanced-food-recognition/analyze-single`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ imageData, options })
     });
     
     const result = await response.json();
     onCapture(result);
   };
   ```

## Testing

### Running Tests
```bash
# Run enhanced food recognition tests
npm test -- enhanced-food-recognition.test.ts

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- Enhanced Food Recognition Service: 95%
- Portion Size Service: 90%
- API Routes: 85%
- Integration Tests: 80%

## Performance Considerations

### Optimization Tips
1. **Image Preprocessing**: Resize images to optimal dimensions before analysis
2. **Caching**: Cache frequently accessed food items and nutritional data
3. **Batch Processing**: Process multiple images in parallel when possible
4. **Memory Management**: Proper cleanup of image data after processing

### Performance Metrics
- **Single Food Analysis**: 2-3 seconds
- **Multi-Food Analysis**: 3-5 seconds
- **Restaurant Menu Recognition**: 4-6 seconds
- **Portion Size Estimation**: 1-2 seconds

## Error Handling

### Common Error Codes
- `INSUFFICIENT_MEMORY`: Device memory too low for processing
- `IMAGE_TOO_LARGE`: Image exceeds size limits
- `PROCESSING_TIMEOUT`: Analysis took too long
- `LOW_CONFIDENCE`: Results below confidence threshold
- `INVALID_IMAGE_FORMAT`: Unsupported image format

### Error Recovery
1. **Retry Logic**: Implement exponential backoff for transient errors
2. **Fallback Mode**: Use basic recognition if enhanced features fail
3. **User Feedback**: Clear error messages and retry options
4. **Logging**: Detailed error logging for debugging

## Future Enhancements

### Planned Features
1. **Real-time Video Analysis**: Live camera feed analysis
2. **AR Overlay**: Augmented reality portion size visualization
3. **Voice Commands**: Hands-free operation
4. **Meal Planning Integration**: Automatic meal planning based on analysis
5. **Social Features**: Share meals and get community feedback

### Database Expansion
- **500K+ Food Items**: Continuous expansion of nutritional database
- **International Foods**: Support for regional and international cuisines
- **Custom Foods**: User-contributed food database
- **Restaurant Partnerships**: Direct integration with restaurant menus

## Support

### Documentation
- API Documentation: `/docs/api.md`
- Integration Guide: `/docs/integration.md`
- Troubleshooting: `/docs/troubleshooting.md`

### Contact
- **Email**: support@aicalorietracker.com
- **Discord**: Join our community for support and feature requests
- **GitHub**: Report issues and contribute to the project

## License

This feature is part of the AI Calorie Tracker project and is subject to the same license terms. See the main project license for details.