
 //Standard API JSON Response Utility Class
 //Provides consistent formatting for success and error payloads.

class ApiResponse {
  //Return standard success JSON response
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

 
 //Return standard error JSON response
  static error(res, message = 'Server Error', statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

//Functional response sender helper
export const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export default ApiResponse;
