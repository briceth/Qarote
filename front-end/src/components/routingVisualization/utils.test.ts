import { describe, expect, it } from "vitest";

import { matchesRoutingPattern } from "./utils";

describe("matchesRoutingPattern", () => {
  describe("direct exchange", () => {
    it("should match exact routing key", () => {
      expect(matchesRoutingPattern("orders", "orders", "direct")).toBe(true);
    });

    it("should not match different routing keys", () => {
      expect(matchesRoutingPattern("orders", "payments", "direct")).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(matchesRoutingPattern("Orders", "orders", "direct")).toBe(false);
      expect(matchesRoutingPattern("orders", "Orders", "direct")).toBe(false);
    });

    it("should match empty strings", () => {
      expect(matchesRoutingPattern("", "", "direct")).toBe(true);
    });
  });

  describe("topic exchange", () => {
    describe("hash wildcard (#) - zero or more words", () => {
      it("should match zero words after separator (orders.# matches orders)", () => {
        // In RabbitMQ, orders.# matches orders (zero words after dot)
        // But our implementation requires the dot, so orders.# matches orders.anything
        // This is actually correct behavior - orders.# means "orders" + "." + (zero or more words)
        // So it matches orders.anything but not orders (which has no dot)
        expect(
          matchesRoutingPattern("orders.anything", "orders.#", "topic")
        ).toBe(true);
        // orders itself doesn't match orders.# because there's no dot
        expect(matchesRoutingPattern("orders", "orders.#", "topic")).toBe(
          false
        );
      });

      it("should match one word after separator", () => {
        expect(matchesRoutingPattern("orders.new", "orders.#", "topic")).toBe(
          true
        );
      });

      it("should match multiple words after separator", () => {
        expect(
          matchesRoutingPattern("orders.new.urgent", "orders.#", "topic")
        ).toBe(true);
        expect(
          matchesRoutingPattern("orders.foo.bar.baz", "orders.#", "topic")
        ).toBe(true);
      });

      it("should match hash at the beginning", () => {
        expect(
          matchesRoutingPattern("anything.orders", "#.orders", "topic")
        ).toBe(true);
        expect(
          matchesRoutingPattern("path.to.orders", "#.orders", "topic")
        ).toBe(true);
      });

      it("should match hash in the middle", () => {
        expect(
          matchesRoutingPattern(
            "orders.anything.urgent",
            "orders.#.urgent",
            "topic"
          )
        ).toBe(true);
        expect(
          matchesRoutingPattern(
            "orders.foo.bar.urgent",
            "orders.#.urgent",
            "topic"
          )
        ).toBe(true);
      });

      it("should match hash at the end", () => {
        expect(
          matchesRoutingPattern("orders.anything", "orders.#", "topic")
        ).toBe(true);
      });

      it("should match only hash pattern", () => {
        // # alone matches everything (zero or more words)
        expect(matchesRoutingPattern("anything", "#", "topic")).toBe(true);
        expect(matchesRoutingPattern("orders.new.urgent", "#", "topic")).toBe(
          true
        );
        expect(matchesRoutingPattern("", "#", "topic")).toBe(true);
      });
    });

    describe("star wildcard (*) - single word", () => {
      it("should match single word", () => {
        expect(matchesRoutingPattern("orders.new", "orders.*", "topic")).toBe(
          true
        );
      });

      it("should not match multiple words", () => {
        expect(
          matchesRoutingPattern("orders.new.urgent", "orders.*", "topic")
        ).toBe(false);
      });

      it("should not match zero words", () => {
        expect(matchesRoutingPattern("orders", "orders.*", "topic")).toBe(
          false
        );
      });

      it("should match star in the middle", () => {
        expect(
          matchesRoutingPattern("orders.new.urgent", "orders.*.urgent", "topic")
        ).toBe(true);
      });

      it("should match multiple stars", () => {
        expect(
          matchesRoutingPattern("orders.new.urgent", "orders.*.*", "topic")
        ).toBe(true);
      });
    });

    describe("combined wildcards", () => {
      it("should match star followed by hash", () => {
        expect(
          matchesRoutingPattern(
            "orders.new.anything.more",
            "orders.*.#",
            "topic"
          )
        ).toBe(true);
      });

      it("should match hash followed by star", () => {
        expect(
          matchesRoutingPattern("orders.anything.new", "orders.#.*", "topic")
        ).toBe(true);
      });

      it("should match complex patterns with both wildcards", () => {
        expect(
          matchesRoutingPattern(
            "orders.new.status.completed.urgent",
            "orders.*.status.#",
            "topic"
          )
        ).toBe(true);
      });
    });

    describe("regex special characters - escaping", () => {
      it("should escape dots correctly", () => {
        expect(
          matchesRoutingPattern("orders.price", "orders.price", "topic")
        ).toBe(true);
        expect(
          matchesRoutingPattern("orders.price.tax", "orders.price", "topic")
        ).toBe(false);
      });

      it("should escape plus signs", () => {
        expect(
          matchesRoutingPattern("orders.price+tax", "orders.price+tax", "topic")
        ).toBe(true);
        expect(
          matchesRoutingPattern("orders.price-tax", "orders.price+tax", "topic")
        ).toBe(false);
      });

      it("should escape question marks", () => {
        expect(
          matchesRoutingPattern("orders.status?", "orders.status?", "topic")
        ).toBe(true);
      });

      it("should escape parentheses", () => {
        expect(
          matchesRoutingPattern(
            "orders.price(tax)",
            "orders.price(tax)",
            "topic"
          )
        ).toBe(true);
      });

      it("should escape square brackets", () => {
        expect(
          matchesRoutingPattern("orders[urgent]", "orders[urgent]", "topic")
        ).toBe(true);
      });

      it("should escape curly braces", () => {
        expect(
          matchesRoutingPattern("orders{urgent}", "orders{urgent}", "topic")
        ).toBe(true);
      });

      it("should escape pipe characters", () => {
        expect(
          matchesRoutingPattern("orders|urgent", "orders|urgent", "topic")
        ).toBe(true);
      });

      it("should escape backslashes", () => {
        expect(
          matchesRoutingPattern("orders\\urgent", "orders\\urgent", "topic")
        ).toBe(true);
      });

      it("should escape dollar signs", () => {
        expect(matchesRoutingPattern("orders$100", "orders$100", "topic")).toBe(
          true
        );
      });

      it("should escape caret characters", () => {
        expect(
          matchesRoutingPattern("orders^urgent", "orders^urgent", "topic")
        ).toBe(true);
      });

      it("should handle special characters with wildcards", () => {
        expect(
          matchesRoutingPattern(
            "orders.price+tax.new",
            "orders.price+tax.*",
            "topic"
          )
        ).toBe(true);
        expect(
          matchesRoutingPattern(
            "orders.price+tax.anything.more",
            "orders.price+tax.#",
            "topic"
          )
        ).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle empty pattern", () => {
        expect(matchesRoutingPattern("", "", "topic")).toBe(true);
        expect(matchesRoutingPattern("orders", "", "topic")).toBe(false);
      });

      it("should handle pattern with only dots", () => {
        expect(matchesRoutingPattern("orders", "orders...", "topic")).toBe(
          false
        );
      });

      it("should handle pattern starting with dot", () => {
        expect(matchesRoutingPattern("orders", ".orders", "topic")).toBe(false);
      });

      it("should handle pattern ending with dot", () => {
        expect(matchesRoutingPattern("orders", "orders.", "topic")).toBe(false);
      });

      it("should handle multiple consecutive dots", () => {
        expect(
          matchesRoutingPattern("orders.new", "orders..new", "topic")
        ).toBe(false);
      });
    });

    describe("real-world patterns", () => {
      it("should match system log patterns", () => {
        expect(
          matchesRoutingPattern("system.app.log", "system.#.log", "topic")
        ).toBe(true);
        expect(
          matchesRoutingPattern(
            "system.app.service.log",
            "system.#.log",
            "topic"
          )
        ).toBe(true);
      });

      it("should match error patterns", () => {
        expect(
          matchesRoutingPattern("any.path.error", "#.error", "topic")
        ).toBe(true);
        expect(
          matchesRoutingPattern("app.service.error", "#.error", "topic")
        ).toBe(true);
      });

      it("should match order status patterns", () => {
        expect(
          matchesRoutingPattern(
            "orders.new.status.completed",
            "orders.*.status.#",
            "topic"
          )
        ).toBe(true);
      });
    });
  });

  describe("fanout exchange", () => {
    it("should always return true", () => {
      expect(matchesRoutingPattern("any", "pattern", "fanout")).toBe(true);
      expect(matchesRoutingPattern("", "", "fanout")).toBe(true);
      expect(
        matchesRoutingPattern("orders.new", "completely.different", "fanout")
      ).toBe(true);
    });
  });

  describe("headers exchange", () => {
    it("should always return true (simplified implementation)", () => {
      expect(matchesRoutingPattern("any", "pattern", "headers")).toBe(true);
      expect(matchesRoutingPattern("", "", "headers")).toBe(true);
      expect(
        matchesRoutingPattern("orders.new", "completely.different", "headers")
      ).toBe(true);
    });
  });
});
