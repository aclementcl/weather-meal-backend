export interface WeatherProviderDailyForecast {
  temperatureMin: number;
  temperatureMax: number;
  weatherCode?: number;
}

export interface OpenMeteoDailyResponse {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
  };
}
