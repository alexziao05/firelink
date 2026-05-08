import math
import numpy as np

INF = 1e12

A = 5

def compute_weight(
    travel_time,
    distance_to_fire,
    wind_speed,
    alignment,
    closed
):

    if closed:
        return INF

    # Fire proximity penalty
    fire_factor = (
        1 + A * math.exp(-distance_to_fire / D)
    )

    # Wind spread penalty
    wind_factor = (
        1 + max(0, alignment) * (wind_speed / 20)
    )

    return (
        travel_time
        * fire_factor
        * wind_factor
    )