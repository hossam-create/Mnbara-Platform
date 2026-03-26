package listings

  import "fmt"

  // Validate checks that the SearchRequest fields are self-consistent.
  func (r *SearchRequest) Validate() error {
        if r.MinPrice != nil && *r.MinPrice < 0 {
                return fmt.Errorf("price cannot be negative")
        }
        if r.MaxPrice != nil && *r.MaxPrice < 0 {
                return fmt.Errorf("price cannot be negative")
        }
        if r.MinPrice != nil && r.MaxPrice != nil && *r.MaxPrice > 0 && *r.MinPrice > *r.MaxPrice {
                return fmt.Errorf("min_price must be <= max_price")
        }
        if r.Radius > 0 && (r.Lat == nil || r.Lng == nil) {
                return fmt.Errorf("lat and lng required when radius is set")
        }
        return nil
  }
  