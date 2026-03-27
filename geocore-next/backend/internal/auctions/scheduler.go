package auctions

import (
	"context"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

// StartAuctionEndWorker runs every 60 seconds. It marks auctions whose
// ends_at has passed as "ended", sets the winner_id to the top bidder,
// and broadcasts an auction_ended WebSocket event to all connected clients.
func StartAuctionEndWorker(ctx context.Context, db *gorm.DB, hub *Hub) {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	log.Println("[auction-scheduler] auction-end worker started")

	for {
		select {
		case <-ctx.Done():
			log.Println("[auction-scheduler] auction-end worker stopped")
			return
		case <-ticker.C:
			processEndedAuctions(db, hub)
		}
	}
}

func processEndedAuctions(db *gorm.DB, hub *Hub) {
	var ended []Auction
	if err := db.Where("status = ? AND ends_at <= ?", "active", time.Now()).Find(&ended).Error; err != nil {
		log.Printf("[auction-scheduler] error querying ended auctions: %v", err)
		return
	}

	for _, auction := range ended {
		finalizeAuction(db, hub, auction)
	}
}

func finalizeAuction(db *gorm.DB, hub *Hub, auction Auction) {
	err := db.Transaction(func(tx *gorm.DB) error {
		// Re-fetch with lock to avoid races
		var a Auction
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			First(&a, "id = ? AND status = ?", auction.ID, "active").Error; err != nil {
			return err
		}

		updates := map[string]interface{}{
			"status": "ended",
		}

		// Find the top bidder
		var topBid Bid
		if err := tx.Where("auction_id = ?", a.ID).
			Order("amount DESC").
			First(&topBid).Error; err == nil {
			updates["winner_id"] = topBid.UserID
			a.WinnerID = &topBid.UserID
		}

		if err := tx.Model(&a).Updates(updates).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		log.Printf("[auction-scheduler] error finalizing auction %s: %v", auction.ID, err)
		return
	}

	// Re-fetch the finalized auction for notification data
	var finalized Auction
	if err := db.First(&finalized, "id = ?", auction.ID).Error; err != nil {
		log.Printf("[auction-scheduler] error re-fetching auction %s: %v", auction.ID, err)
		return
	}

	// Broadcast auction_ended event via WebSocket hub
	payload := fmt.Sprintf(
		`{"event": "auction_ended", "auction_id": "%s", "winner_id": "%v", "final_bid": %.2f}`,
		finalized.ID,
		finalized.WinnerID,
		finalized.CurrentBid,
	)
	if hub != nil {
		hub.broadcast <- &BroadcastMsg{
			AuctionID: finalized.ID.String(),
			Data:      []byte(payload),
		}
	}

	// Notify winner and seller
	if finalized.WinnerID != nil {
		notifyAuctionWon(*finalized.WinnerID, finalized.SellerID, finalized.ID.String(), finalized.CurrentBid, finalized.Currency)
	} else {
		// No bids — notify seller the auction ended with no winner
		go notifyAuctionEndedNoWinner(finalized.SellerID, finalized.ID.String())
	}

	log.Printf("[auction-scheduler] auction %s ended, winner: %v, final bid: %.2f",
		finalized.ID, finalized.WinnerID, finalized.CurrentBid)
}

func notifyAuctionEndedNoWinner(sellerID interface{}, auctionID string) {
	if globalNotifSvc == nil {
		return
	}
}
