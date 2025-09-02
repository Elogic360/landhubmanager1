/*
  # Create land plots mapping system

  1. New Tables
    - `land_plots`
      - `id` (uuid, primary key) - Unique plot identifier
      - `title` (text) - Plot display name
      - `description` (text) - Detailed plot description
      - `price` (numeric) - Plot price in USD
      - `area` (numeric) - Plot area in square feet
      - `location` (text) - Human-readable location
      - `coordinates` (jsonb) - Exact lat/lng coordinates
      - `boundaries` (jsonb) - Array of boundary points
      - `status` - Plot availability status
      - `type` - Property type (residential, commercial, etc.)
      - `amenities` (text[]) - Available amenities
      - `images` (text[]) - Image URLs
      - `owner_*` - Owner contact information
      - `zoning` (text) - Zoning classification
      - `utilities` (text[]) - Available utilities
      - `access_roads` (boolean) - Road access availability
      - `soil_type` (text) - Soil classification
      - `elevation` (numeric) - Elevation in feet
      - Timestamps for creation and updates

    - `plot_inquiries`
      - `id` (uuid, primary key) - Unique inquiry identifier
      - `plot_id` (uuid, foreign key) - Reference to land plot
      - `name` (text) - Inquirer name
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone
      - `message` (text) - Inquiry message
      - `inspection_date` (date) - Preferred inspection date
      - `financing_needed` (boolean) - Financing requirement
      - `status` - Inquiry status tracking
      - `created_at` (timestamp) - Inquiry timestamp

  2. Security
    - Enable RLS on both tables
    - Public read access for land plots
    - Authenticated write access for inquiries
    - Owner-only access for plot management

  3. Indexes
    - Geospatial indexes for location-based queries
    - Performance indexes for filtering and searching
*/

-- Create land_plots table
CREATE TABLE IF NOT EXISTS land_plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  area numeric NOT NULL CHECK (area > 0),
  location text NOT NULL,
  coordinates jsonb NOT NULL,
  boundaries jsonb,
  status text NOT NULL CHECK (status IN ('available', 'sold', 'reserved', 'pending')) DEFAULT 'available',
  type text NOT NULL CHECK (type IN ('residential', 'commercial', 'agricultural', 'industrial')),
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  owner_name text NOT NULL,
  owner_contact text NOT NULL,
  owner_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  zoning text,
  utilities text[],
  access_roads boolean,
  soil_type text,
  elevation numeric
);

-- Create plot_inquiries table
CREATE TABLE IF NOT EXISTS plot_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id uuid NOT NULL REFERENCES land_plots(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text DEFAULT '',
  inspection_date date,
  financing_needed boolean DEFAULT false,
  status text NOT NULL CHECK (status IN ('pending', 'contacted', 'viewed', 'closed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE land_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for land_plots (public read access)
CREATE POLICY "Anyone can view land plots"
  ON land_plots
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert land plots"
  ON land_plots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Plot owners can update their plots"
  ON land_plots
  FOR UPDATE
  TO authenticated
  USING (owner_email = auth.jwt() ->> 'email');

-- RLS Policies for plot_inquiries
CREATE POLICY "Anyone can create inquiries"
  ON plot_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries"
  ON plot_inquiries
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_land_plots_status ON land_plots(status);
CREATE INDEX IF NOT EXISTS idx_land_plots_type ON land_plots(type);
CREATE INDEX IF NOT EXISTS idx_land_plots_price ON land_plots(price);
CREATE INDEX IF NOT EXISTS idx_land_plots_area ON land_plots(area);
CREATE INDEX IF NOT EXISTS idx_land_plots_location ON land_plots USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_land_plots_coordinates ON land_plots USING gin(coordinates);
CREATE INDEX IF NOT EXISTS idx_plot_inquiries_plot_id ON plot_inquiries(plot_id);
CREATE INDEX IF NOT EXISTS idx_plot_inquiries_status ON plot_inquiries(status);

-- Insert sample data for development
INSERT INTO land_plots (
  title, description, price, area, location, coordinates, boundaries, status, type, 
  amenities, images, owner_name, owner_contact, owner_email, zoning, utilities, 
  access_roads, soil_type, elevation
) VALUES 
(
  'Scenic Valley Plot',
  'Beautiful 5-acre plot with mountain views and natural water source. Perfect for residential development or private retreat. The land features rolling hills, mature trees, and excellent soil quality.',
  125000,
  217800,
  'Blue Ridge Mountains, VA',
  '{"lat": 38.5767, "lng": -78.8714}',
  '[{"lat": 38.5770, "lng": -78.8720}, {"lat": 38.5770, "lng": -78.8708}, {"lat": 38.5764, "lng": -78.8708}, {"lat": 38.5764, "lng": -78.8720}]',
  'available',
  'residential',
  ARRAY['electricity', 'water', 'road_access', 'landscaping'],
  ARRAY['https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'Sarah Johnson',
  '+1-540-555-0123',
  'sarah.johnson@email.com',
  'Residential R-2',
  ARRAY['Electric', 'Water', 'Septic'],
  true,
  'Loamy Clay',
  1250
),
(
  'Downtown Commercial Lot',
  'Prime commercial real estate in the heart of downtown. Excellent foot traffic and visibility. Zoned for mixed-use development with high growth potential.',
  450000,
  8712,
  'Downtown Richmond, VA',
  '{"lat": 37.5407, "lng": -77.4360}',
  null,
  'available',
  'commercial',
  ARRAY['electricity', 'water', 'internet', 'parking', 'security'],
  ARRAY['https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'Richmond Development Corp',
  '+1-804-555-0456',
  'info@richmonddevelopment.com',
  'Commercial C-3',
  ARRAY['Electric', 'Water', 'Sewer', 'Gas', 'Fiber Internet'],
  true,
  'Urban Fill',
  160
),
(
  'Agricultural Farmland',
  '50-acre productive farmland with irrigation system. Excellent soil quality for crops or livestock. Includes barn and equipment storage.',
  275000,
  2178000,
  'Shenandoah Valley, VA',
  '{"lat": 38.9517, "lng": -78.1694}',
  '[{"lat": 38.9520, "lng": -78.1700}, {"lat": 38.9520, "lng": -78.1688}, {"lat": 38.9514, "lng": -78.1688}, {"lat": 38.9514, "lng": -78.1700}]',
  'reserved',
  'agricultural',
  ARRAY['electricity', 'water', 'road_access', 'irrigation'],
  ARRAY['https://images.pexels.com/photos/2253643/pexels-photo-2253643.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'Valley Farms LLC',
  '+1-540-555-0789',
  'contact@valleyfarms.com',
  'Agricultural A-1',
  ARRAY['Electric', 'Well Water', 'Propane'],
  true,
  'Rich Loam',
  900
),
(
  'Industrial Development Site',
  'Large industrial plot with rail access and highway frontage. Suitable for manufacturing, distribution, or logistics operations.',
  680000,
  653400,
  'Petersburg, VA',
  '{"lat": 37.2279, "lng": -77.4019}',
  null,
  'available',
  'industrial',
  ARRAY['electricity', 'water', 'road_access', 'rail_access', 'security'],
  ARRAY['https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/259620/pexels-photo-259620.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'Industrial Properties Inc',
  '+1-804-555-0321',
  'leasing@industrialproperties.com',
  'Industrial I-2',
  ARRAY['Electric', 'Water', 'Sewer', 'Natural Gas'],
  true,
  'Engineered Fill',
  130
),
(
  'Waterfront Residential Land',
  'Exclusive waterfront property with 300 feet of lake frontage. Perfect for luxury home construction with stunning water views and private dock access.',
  850000,
  130680,
  'Lake Anna, VA',
  '{"lat": 38.1291, "lng": -77.7989}',
  '[{"lat": 38.1295, "lng": -77.7995}, {"lat": 38.1295, "lng": -77.7983}, {"lat": 38.1287, "lng": -77.7983}, {"lat": 38.1287, "lng": -77.7995}]',
  'pending',
  'residential',
  ARRAY['electricity', 'water', 'internet', 'dock_access', 'landscaping'],
  ARRAY['https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'Lakefront Properties Group',
  '+1-540-555-0654',
  'sales@lakefrontproperties.com',
  'Residential R-1',
  ARRAY['Electric', 'Water', 'Septic', 'Cable'],
  true,
  'Sandy Loam',
  250
),
(
  'Historic Town Center Plot',
  'Rare opportunity in historic town center. Perfect for boutique retail, restaurant, or mixed-use development. Walking distance to all amenities.',
  325000,
  6534,
  'Historic Williamsburg, VA',
  '{"lat": 37.2707, "lng": -76.7075}',
  null,
  'sold',
  'commercial',
  ARRAY['electricity', 'water', 'internet', 'parking', 'foot_traffic'],
  ARRAY['https://images.pexels.com/photos/1838640/pexels-photo-1838640.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'Historic Preservation Trust',
  '+1-757-555-0987',
  'properties@historictrust.org',
  'Historic Commercial HC-1',
  ARRAY['Electric', 'Water', 'Sewer', 'Gas'],
  true,
  'Historic Fill',
  45
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_land_plots_updated_at 
    BEFORE UPDATE ON land_plots 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();